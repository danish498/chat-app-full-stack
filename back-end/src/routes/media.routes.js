import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/media.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Memory storage for streams
const storage = multer.memoryStorage();

// Image Upload Configuration (5MB Limit)
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

// Video Upload Configuration (20MB Limit)
const videoUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only videos are allowed"), false);
    }
  },
});

// POST /api/media/upload/image
router.post("/upload/image", imageUpload.single("file"), uploadFile);

// POST /api/media/upload/video
router.post("/upload/video", videoUpload.single("file"), uploadFile);

export default router;
