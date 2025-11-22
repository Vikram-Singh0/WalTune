import { FastifyPluginAsync } from "fastify";
import { uploadAudio } from "../walrus/uploadAudio.js";

const walrusRoutes: FastifyPluginAsync = async (fastify) => {
  // Upload file to Walrus via HTTP publisher
  fastify.post("/upload", async (request, reply) => {
    const startTime = Date.now();
    let filename = "unknown";
    let fileSize = 0;

    try {
      // Validate request has file
      const data = await request.file();

      if (!data) {
        console.error("❌ Upload request missing file");
        return reply.code(400).send({ 
          error: "No file uploaded",
          success: false,
        });
      }

      // Get file details
      filename = data.filename || "audio.mp3";
      const buffer = await data.toBuffer();
      fileSize = buffer.length;

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileSize > maxSize) {
        console.error(`❌ File too large: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        return reply.code(400).send({
          error: `File size exceeds 50MB limit. File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`,
          success: false,
        });
      }

      // Validate file type
      if (!filename.toLowerCase().endsWith(".mp3")) {
        console.error(`❌ Invalid file type: ${filename}`);
        return reply.code(400).send({
          error: "Only MP3 files are supported",
          success: false,
        });
      }

      console.log(`📥 Received upload: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

      // Upload to Walrus
      const result = await uploadAudio(buffer, filename);

      if (!result.success) {
        console.error(`❌ Upload failed for ${filename}: ${result.error}`);
        return reply.code(400).send({
          error: result.error || "Upload failed",
          success: false,
        });
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Upload successful: ${filename} -> ${result.blobId} (${duration}s)`);

      return reply.send({
        success: true,
        blobId: result.blobId,
        streamUrl: result.walrusCID,
        filename,
        fileSize,
        uploadDuration: `${duration}s`,
      });
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const errorMessage = error?.message || "Unknown error";
      
      console.error(`❌ Upload error for ${filename}:`, {
        error: errorMessage,
        stack: error?.stack,
        duration: `${duration}s`,
        fileSize: fileSize > 0 ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : "unknown",
      });

      // Determine appropriate status code
      let statusCode = 500;
      if (errorMessage.includes("timeout")) {
        statusCode = 504; // Gateway Timeout
      } else if (errorMessage.includes("not available") || errorMessage.includes("404")) {
        statusCode = 503; // Service Unavailable
      } else if (errorMessage.includes("size") || errorMessage.includes("type")) {
        statusCode = 400; // Bad Request
      }

      return reply.code(statusCode).send({
        error: "Upload failed",
        message: errorMessage,
        success: false,
        filename,
      });
    }
  });
};

export default walrusRoutes;
