// server/routes/testRoutes.js
import express from "express";
import speakeasy from "speakeasy";
import User from "../models/Users.js";

const router = express.Router();

// Test TOTP generation for a given email
router.get("/totp/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = speakeasy.totp({
      secret: user.totpSecret || user.secret,
      encoding: "base32",
    });

    console.log(`✅ Expected TOTP for ${email}:`, token);
    res.json({ expectedCode: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
