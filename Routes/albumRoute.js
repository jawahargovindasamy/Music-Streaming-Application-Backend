import express from "express";
import {
  deleteAlbum,
  getAlbumByArtistId,
  getAlbumById,
  getAllAlbum,
  updateAlbumById,
  uploadAlbum,
} from "../Controllers/albumController.js";
import { uploadAlbumPic } from "../Middleware/albumPicMiddleware.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, uploadAlbumPic, uploadAlbum);
router.get("/list", getAllAlbum);
router.get("/list/:id", getAlbumById);
router.put('/update/:id', authMiddleware, uploadAlbumPic, updateAlbumById);
router.get("/artist/:id", getAlbumByArtistId);
router.delete("/delete/:id", deleteAlbum);

export default router;
