import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  getUserFollowedArtists,
  getUserLikedAlbums,
  getUserLikedSongs,
  likeAlbum,
  likeSong,
  recommendations,
  search,
  updateUser,
} from "../Controllers/userController.js";
import { uploadProfilePic } from "../Middleware/profilePicMiddleware.js";

const router = express.Router();

router.put("/update/:id", authMiddleware, uploadProfilePic, updateUser);
router.get("/list", authMiddleware, getAllUsers);
router.get("/list/:id", getUserById);
router.post("/like/song", authMiddleware, likeSong);
router.get("/like/song/list", authMiddleware, getUserLikedSongs);
router.post("/like/album", authMiddleware, likeAlbum);
router.get("/like/album/list", authMiddleware, getUserLikedAlbums);
router.get("/follow/list", authMiddleware, getUserFollowedArtists);
router.delete("/delete/:id", authMiddleware, deleteUser);
router.get("/recommendations", authMiddleware, recommendations);
router.get("/search", search);

export default router;
