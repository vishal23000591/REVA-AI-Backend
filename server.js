import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

// ----------------------
// Middleware
// ----------------------
app.use(cors({
  origin: "http://localhost:5174",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Handle preflight requests
app.options(/.*/, cors());

// Body parser (must come before routes)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static uploads
app.use("/uploads", express.static("uploads"));

// ----------------------
// Routes
// ----------------------
app.use("/api/addjobs", jobRoutes);          // Jobs API
app.use("/api/auth", authRoutes);         // Auth API
app.use("/api/files", fileRoutes);        // File uploads
app.use("/api/test", testRoutes);         // Test API
app.use("/api/admin", adminRoutes);       // Admin signup/login

// Test admin route
app.get("/api/admin/test", (req, res) => res.send("Admin routes are working"));

// Root route
app.get("/", (req, res) => res.send("Backend is running"));

// ----------------------
// MongoDB connection
// ----------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
