// routes/jobRoutes.js
import express from "express";
import AddJob from "../models/AddJob.js";

const router = express.Router();

// POST new job
router.post("/", async (req, res) => {
  try {
    const { title, company, location, type, description } = req.body;

    if (!title || !company || !location || !type || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newJob = new AddJob({ title, company, location, type, description });
    const saved = await newJob.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await AddJob.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
