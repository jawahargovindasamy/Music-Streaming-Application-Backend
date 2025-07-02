import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import path from "path";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Audio Streaming/Album",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      const originalName = path.parse(file.originalname).name;
      return originalName.replace(/\s+/g, "_");
    },
  },
});

const upload = multer({ storage });

export const uploadAlbumPic = upload.single("image");
