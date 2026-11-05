import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  value: {
    type: Number,
    default: 0,
    min: 0
  }
});

export default mongoose.model("Counter", counterSchema);