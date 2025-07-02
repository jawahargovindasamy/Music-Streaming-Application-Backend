import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  desc: {
    type: String,
    default: "",
  },
  artistID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artist",
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  likes: {
    type: Number,
    default: 0,
  },
  bgColor: {
    type: String,
    default: "#000000",
  },
}, {
  timestamps: true,
});

const Album = mongoose.model("Album", albumSchema);

export default Album;
