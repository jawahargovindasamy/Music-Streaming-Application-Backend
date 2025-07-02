import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  createStream,
  recentlyPlayed,
} from "../Controllers/streamController.js";

const router = express.Router();

router.post("/create", authMiddleware, createStream);
router.get("/recent", authMiddleware, recentlyPlayed);

export default router;
