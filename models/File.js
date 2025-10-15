import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    docType: { type: String, required: true },   // ✅ Added docType
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    path: { type: String },
    url: { type: String }, // Direct link for frontend
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);
