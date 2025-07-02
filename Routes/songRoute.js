import express from "express";
import {
  deleteSong,
  incrementViews,
  listSong,
  updateSongById,
  uploadSong,
} from "../Controllers/songController.js";
import { uploadSongsMiddleware } from "../Middleware/songMiddleware.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, uploadSongsMiddleware, uploadSong);
router.get("/list", listSong);
router.put(
  "/update/:id",
  authMiddleware,
  uploadSongsMiddleware,
  updateSongById
);
router.delete("/delete/:id", authMiddleware, deleteSong);
router.post("/increment/:id", incrementViews);

export default router;
