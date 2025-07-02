import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  deleteSongFromPlaylist,
  getPlaylist,
  getPlaylistbyId,
  updatePlaylist,
} from "../Controllers/playlistController.js";
import { uploadAlbumPic } from "../Middleware/albumPicMiddleware.js";

const router = express.Router();

router.get("/list", authMiddleware, getPlaylist);
router.get("/list/:id", authMiddleware, getPlaylistbyId);
router.post("/create", authMiddleware, uploadAlbumPic, createPlaylist);
router.post("/add-song/:id", authMiddleware, addSongToPlaylist);
router.delete("/delete/:id", authMiddleware, deletePlaylist);
router.put("/update-song/:id", authMiddleware, deleteSongFromPlaylist);
router.put("/update/:id", authMiddleware, uploadAlbumPic, updatePlaylist);

export default router;
