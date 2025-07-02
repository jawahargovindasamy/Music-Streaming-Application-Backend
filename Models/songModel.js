import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      default: "",
    },
    albumID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: true,
    },
    artistID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    genre: {
      type: String,
      enum: [
        "Pop",
        "Rock",
        "Hip-Hop",
        "Rap",
        "R&B",
        "EDM",
        "Dance",
        "Indie",
        "Alternative",
        "Country",
        "Jazz",
        "Blues",
        "Classical",
        "Reggae",
        "Metal",
        "Punk",
        "Funk",
        "Soul",
        "Folk",
        "kuthu",
        "Romantic",
        "Peppy",
        "Remix",
        "Upbeat",
        "Carnatic-influenced",
        "Mid-tempo",
        "Arabic",
        "Melodic",
        "Playful",
        "Nostalgic",
        "Theme",
        "Pathos"
      ],
      default: "",
    },
    duration: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    audio: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Song = mongoose.model("Song", songSchema);

export default Song;
