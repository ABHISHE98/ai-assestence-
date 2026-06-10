import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with generous limits for base64 file payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Endpoint: Extract & Analyze Document Text
app.post("/api/analyze", async (req, res) => {
  try {
    const { file, language } = req.body;

    if (!file || !file.name || !file.data) {
      return res.status(400).json({ error: "No file data provided." });
    }

    const selectedLanguage = language || "English";
    const fileName = file.name;
    const fileType = file.type || "";
    
    // Extract base64 content
    // Check if the data contains data URL prefix and extract the pure base64
    const base64Data = file.data.includes(";base64,")
      ? file.data.split(";base64,")[1]
      : file.data;

    const buffer = Buffer.from(base64Data, "base64");
    let extractedText = "";
    let detectedType = "text";

    const isImage = fileType.startsWith("image/") || 
                    /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(fileName);
    const isPDF = fileType === "application/pdf" || 
                  /\.pdf$/i.test(fileName);
    const isDocx = fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                   /\.docx$/i.test(fileName);

    if (isPDF) {
      detectedType = "pdf";
      try {
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        extractedText = parsed.text || "";
      } catch (pdfErr: any) {
        console.error("PDF Parsing error:", pdfErr);
        return res.status(422).json({ error: `Failed to parse PDF document: ${pdfErr.message || pdfErr}` });
      }
    } else if (isDocx) {
      detectedType = "docx";
      try {
        const parsed = await mammoth.extractRawText({ buffer });
        extractedText = parsed.value || "";
      } catch (docxErr: any) {
        console.error("DOCX Parsing error:", docxErr);
        return res.status(422).json({ error: `Failed to parse Word document: ${docxErr.message || docxErr}` });
      }
    } else if (isImage) {
      detectedType = "image";
      // For images, we pass the image directly to Gemini to perform OCR & describe
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: fileType || "image/png",
                },
              },
              {
                text: "Extract all visible text from this image precisely. If there is structured text, tabular data, or structured content, keep it organized. If the image contains visual charts, diagrams, or objects without much text, describe them in rich detail so a user can query details about them later.",
              },
            ]
          },
        });
        extractedText = response.text || "No text could be extracted from this image.";
      } catch (ocrErr: any) {
        console.error("Gemini Image OCR error:", ocrErr);
        return res.status(500).json({ error: `Failed to process image using Gemini vision: ${ocrErr.message || ocrErr}` });
      }
    } else {
      // Default to plain text
      detectedType = "text";
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      extractedText = `[Empty Document] No readable text found in file: ${fileName}`;
    }

    // Call Gemini 3.5-flash to write an analysis/summary of the text in the chosen language.
    const analysisPrompt = `You are an expert Document Analyst.
Your task is to analyze the extracted text/data from the file "${fileName}" and provide a deep, highly professional, and informative overview in ${selectedLanguage}.

Write your response in beautiful Markdown structure. It MUST include:
1. **Document Classification**: Identify what type of document/image this is.
2. **Executive Summary**: A polished, high-level summary of the core content.
3. **Key Information & Facts**: Structured bullet points highlighting critical data, dates, numbers, or topics found.
4. **Suggested Questions**: Provide exactly 3 or 4 custom, direct questions that the user can ask regarding this document's contents.

All of the analysis must be generated strictly in the "${selectedLanguage}" language.`;

    const summaryResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { text: `DOCUMENT TITLE: ${fileName}\n\nEXTRACTED WORKSPACE CONTENT:\n${extractedText}` },
          { text: analysisPrompt }
        ]
      },
    });

    res.json({
      success: true,
      fileName,
      detectedType,
      charCount: extractedText.length,
      extractedText,
      analysis: summaryResponse.text || "Unable to produce summary.",
    });

  } catch (error: any) {
    console.error("Document analysis endpoint error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// API Endpoint: Chat & Answer Questions based ONLY on document text
app.post("/api/chat", async (req, res) => {
  try {
    const { documentText, history, message, language } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: "Missing document context." });
    }
    if (!message) {
      return res.status(400).json({ error: "Missing user message." });
    }

    const selectedLanguage = language || "English";

    // Setup strict document constraint system prompt
    const systemInstruction = `You are a professional AI Document Assistant.
You have access to the complete extracted content of an uploaded file.
Here is the extracted document content:
=========================================
${documentText}
=========================================

CRITICAL RESPONSE RULES:
1. You MUST answer the user's questions relying ONLY and STRICTLY on the clear facts and details mentioned directly in the document context above.
2. If the user's question asks for information not mentioned in the document, or if the user asks something outside the scope of the document, refuse to answer. Explain clearly and politely that the uploaded document does not contain this information, and do not make up or use outside/general knowledge.
3. You MUST always formulate your entire response in "${selectedLanguage}". Even if the document itself is in a completely different language, translate the relevant context on the fly and write your output in "${selectedLanguage}".
4. Maintain a professional, modern, precise, and supportive tone. Keep responses neat, well-structured in markdown if helpful.

STRICT FORMATTING REQUIREMENTS:
- Never use long, unstructured paragraphs.
- Always structure your answers using Markdown.
- Always use bold text for key labels, fields, and headers (e.g., **Signature/Name:**, **Designation:**, **Date:**, or similar categories like **Key Features:**, **Clause Number:**).
- Extract information accurately and present it line-by-line (e.g., one field or key point per line).
- If the user asks for an explanation in Hindi (including phrases like "hindi me batao", "hindi mein batao", or query written in Hindi), translate the exact same structured formatting into pure Hindi (using the Devanagari script). Ensure standard bold keys in Hindi, e.g., **नाम:**, **पद:**, **दिनांक:**, **विवरण:**, and format everything cleanly, exactly as below.

Example formats to match:
English:
**Signature/Name:** Mohan Kumar (Mohan Kumar)
**Designation:** Additional District Judge, Court No. 2, Karnal
**Date:** 23-04-2014

Hindi:
**नाम:** मोहन कुमार (Mohan Kumar)
**पद:** अपर जिला न्यायाधीश, कोर्ट नंबर 2, करनाल
**दिनांक:** 23-04-2014`;

    // Map client's simple history to the contents field expected by gemini
    // format: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content || msg.text || "" }]
        });
      });
    }

    // Append the latest user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Generate output
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature to maximize factual reliance on the document
      }
    });

    res.json({
      success: true,
      reply: response.text || "Sorry, I could not generate a response."
    });

  } catch (error: any) {
    console.error("Chat endpoint error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


// Configure Vite Dev Server or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Single page app routing fallback for Express v4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
