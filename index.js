import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/dbConfig.js";
import songRoute from "./Routes/songRoute.js";
import albumRoute from "./Routes/albumRoute.js";
import authRoute from "./Routes/authRoute.js";
import adminRoute from "./Routes/adminRoute.js";
import artistRoute from "./Routes/artistRoute.js";
import userRoute from "./Routes/userRoute.js";
import streamRoute from "./Routes/streamRoute.js";
import playlistRoute from "./Routes/playlistRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;

connectDB();

app.get("/", (req, res) => {
  res.status(200).json({
    message: "hello from music streaming backend",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/song", songRoute);
app.use("/api/album", albumRoute);
app.use("/api/admin", adminRoute);
app.use("/api/artist", artistRoute);
app.use("/api/stream", streamRoute);
app.use("/api/playlist", playlistRoute);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
