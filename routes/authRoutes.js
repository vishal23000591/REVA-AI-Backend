// routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";         // Authenticator users
import Customer from "../models/Customer.js"; // Website customers
import speakeasy from "speakeasy";

const router = express.Router();

// ---------------- Signup -----------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: "Customer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Customer({
      name,
      email,
      phone,
      password: hashedPassword,
    });
    await newCustomer.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Login -----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if Authenticator is registered
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Authenticator not registered" });
    }

    // Issue a short-lived temp token (10 mins) until TOTP verification
    const tempToken = jwt.sign(
      { id: customer._id, email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "10m" }
    );

    res.json({
      tempToken,
      message: "Login successful. Enter Authenticator code to continue.",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Verify 6-Digit Authenticator -----------------
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.totpSecret) {
      return res
        .status(404)
        .json({ error: "Authenticator not registered or missing secret" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token: code,
      window: 1, // ±30s window
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Auth successful → issue full JWT
    const customer = await Customer.findOne({ email });
    const token = jwt.sign(
      { id: customer._id, email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Verification successful",
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (err) {
    console.error("Verify-code error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
