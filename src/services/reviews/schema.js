import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ReviewSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default model("Review", ReviewSchema);
