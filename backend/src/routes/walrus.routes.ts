import { FastifyPluginAsync } from "fastify";

const walrusRoutes: FastifyPluginAsync = async (fastify) => {
  // Deprecated: Upload is now handled from frontend using Walrus SDK
  fastify.post("/upload", async (request, reply) => {
    console.warn(
      "⚠️  /api/walrus/upload is deprecated. Use Walrus SDK from frontend."
    );
    return reply.code(410).send({
      error: "Endpoint deprecated",
      message:
        "Please use Walrus SDK directly from frontend. See frontend/lib/walrus-utils.ts",
          blobId: mockBlobId,
          isMock: true,
          message: "Using mock blob ID - Walrus network error",
        };
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      return reply.code(500).send({
        error: "Upload failed",
        message: error.message,
      });
    }
  });
};

export default walrusRoutes;
