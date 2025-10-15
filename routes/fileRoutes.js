import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import File from "../models/File.js";

const router = express.Router();

// ---------------- JWT Middleware ----------------
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ---------------- Multer Config ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ---------------- Upload File ----------------
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!req.body.docType) return res.status(400).json({ error: "Document type is required" });

  try {
    const fileUrl = `http://localhost:3002/uploads/${req.file.filename}`;
    const newFile = new File({
      user: req.userId,
      docType: req.body.docType,   // ✅ Save docType
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: fileUrl,
    });

    await newFile.save();

    res.json({
      message: "File uploaded successfully",
      file: newFile,
      previewUrl: fileUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error while saving file" });
  }
});

// ---------------- Get User Files ----------------
router.get("/user-files", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .select("_id originalname filename mimetype size url createdAt docType");

    res.json({ files });
  } catch (err) {
    console.error("Fetch files error:", err);
    res.status(500).json({ error: "Server error fetching files" });
  }
});

// ---------------- Preview/Download ----------------
router.get("/preview/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    const filePath = path.resolve(file.path);
    res.setHeader("Content-Type", file.mimetype);

    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      res.setHeader("Content-Disposition", `inline; filename="${file.originalname}"`);
    } else {
      res.setHeader("Content-Disposition", `attachment; filename="${file.originalname}"`);
    }

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ error: "Server error previewing file" });
  }
});

export default router;
