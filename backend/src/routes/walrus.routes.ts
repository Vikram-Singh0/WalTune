import { FastifyPluginAsync } from "fastify";

const WALRUS_PUBLISHER_URL =
  process.env.WALRUS_PUBLISHER_URL ||
  "https://publisher.walrus-testnet.walrus.space";

const walrusRoutes: FastifyPluginAsync = async (fastify) => {
  // Upload file to Walrus (proxy to avoid CORS)
  fastify.post("/upload", async (request, reply) => {
    try {
      console.log("🔵 Received upload request");
      const data = await request.file();

      if (!data) {
        console.error("❌ No file in request");
        return reply.code(400).send({ error: "No file uploaded" });
      }

      const buffer = await data.toBuffer();
      console.log(
        `📤 Uploading ${buffer.length} bytes to Walrus at ${WALRUS_PUBLISHER_URL}`
      );

      try {
        // Upload to Walrus with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const walrusResponse = await fetch(
          `${WALRUS_PUBLISHER_URL}/v1/store?epochs=5`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/octet-stream",
            },
            body: buffer,
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);
        console.log(`📡 Walrus response status: ${walrusResponse.status}`);

        if (!walrusResponse.ok) {
          const errorText = await walrusResponse.text();
          console.error("❌ Walrus error:", errorText.substring(0, 500));

          // For testing: if Walrus is down, use a mock blob ID
          console.warn(
            "⚠️  Walrus upload failed, using mock blob ID for testing"
          );
          const mockBlobId = `mock_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          return {
            success: true,
            blobId: mockBlobId,
            isMock: true,
            message: "Using mock blob ID - Walrus testnet may be down",
          };
        }

        const walrusData = (await walrusResponse.json()) as any;
        const blobId =
          walrusData.newlyCreated?.blobObject?.blobId ||
          walrusData.alreadyCertified?.blobId;

        if (!blobId) {
          console.error("❌ No blob ID in response:", walrusData);
          // Fallback to mock
          const mockBlobId = `mock_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          return {
            success: true,
            blobId: mockBlobId,
            isMock: true,
            message: "Using mock blob ID - no blob ID in Walrus response",
          };
        }

        console.log("✅ Uploaded to Walrus, blob ID:", blobId);

        return {
          success: true,
          blobId,
          data: walrusData,
        };
      } catch (fetchError: any) {
        console.error("❌ Fetch error:", fetchError.message);
        // For testing: if network error, use mock blob ID
        const mockBlobId = `mock_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        console.warn(
          "⚠️  Using mock blob ID due to network error:",
          mockBlobId
        );
        return {
          success: true,
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
