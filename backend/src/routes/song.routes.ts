import { FastifyInstance } from "fastify";
import { songController } from "../controllers/songController.js";

export default async function songRoutes(fastify: FastifyInstance) {
  // Upload a new song
  fastify.post("/upload", songController.upload.bind(songController));

  // Get all songs
  fastify.get("/all", songController.getAll.bind(songController));

  // Get song by ID
  fastify.get("/:id", songController.getById.bind(songController));

  // Record a song play
  fastify.post("/play/:id", songController.play.bind(songController));

  // Get songs by artist
  fastify.get(
    "/artist/:artistId",
    songController.getByArtist.bind(songController)
  );
}
