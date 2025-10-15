import express from "express";
import multer from "multer";
import fs from "fs";
import pdfParse from "pdf-parse";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/resume/parse
router.post("/parse", upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer); // For PDFs. DOCX can be added later
    const text = data.text;

    // Simple regex-based extraction
    const extract = (regex) => {
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };

    const result = {
      name: extract(/Name[:\s]+(.+)/i),
      email: extract(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i),
      phone: extract(/(\+?\d{10,15})/),
      linkedin: extract(/linkedin\.com\/[A-z0-9_-]+/i),
      portfolio: extract(/(https?:\/\/)?(www\.)?[\w-]+\.[\w./]+/i),
      skills: extract(/Skills[:\s]+(.+)/i),
      experience: extract(/Experience[:\s]+([\s\S]*?)Education/i),
      education: extract(/Education[:\s]+([\s\S]*)/i),
      coverLetter: "",
    };

    fs.unlinkSync(req.file.path);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

export default router;
