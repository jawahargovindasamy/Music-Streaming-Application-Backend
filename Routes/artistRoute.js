import express from "express";
import {
  addFollower,
  getAllArtists,
  getArtistById,
  getArtistDashboardStats,
  updateArtist,
} from "../Controllers/artistController.js";
import { uploadArtistPic } from "../Middleware/profilePicMiddleware.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getArtistDashboardStats);
router.put("/update/:id", authMiddleware, uploadArtistPic, updateArtist);
router.get("/list", getAllArtists);
router.get("/list/:id", getArtistById);
router.post("/:id/follow", authMiddleware, addFollower);

export default router;
