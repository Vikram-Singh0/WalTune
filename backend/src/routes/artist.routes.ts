import { FastifyInstance } from "fastify";
import { artistController } from "../controllers/artistController.js";

export default async function artistRoutes(fastify: FastifyInstance) {
  // Register a new artist
  fastify.post("/register", artistController.register.bind(artistController));

  // Get artist by wallet address
  fastify.get(
    "/:walletAddress",
    artistController.getByWallet.bind(artistController)
  );

  // Get all artists
  fastify.get("/list/all", artistController.getAll.bind(artistController));
}
