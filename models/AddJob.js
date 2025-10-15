import mongoose from "mongoose";

const addJobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("AddJob", addJobSchema);
