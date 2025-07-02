import mongoose from "mongoose";

const streamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Stream = mongoose.model("Stream", streamSchema);
export default Stream;
