import cloudinary from "../config/cloudinary.js";
import logger from "../utils/logger.js";

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Determine resource type based on mime type
    const resourceType = req.file.mimetype.startsWith("video")
      ? "video"
      : "image";

    // Cloudinary upload options for compression
    const uploadOptions = {
      resource_type: resourceType,
      folder: "chat_app_media",
      quality: "auto",
      fetch_format: "auto",
    };

    // Upload to Cloudinary using a stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error:", error);
          return res.status(500).json({
            success: false,
            message: "Cloudinary upload failed",
            error,
          });
        }

        res.status(200).json({
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
          },
        });
      },
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    logger.error("Media upload error:", error);
    next(error);
  }
};
