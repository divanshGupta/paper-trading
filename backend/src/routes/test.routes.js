import { Router } from "express";
import { prisma } from "../utils/db.js";

const testRouter = Router();

testRouter.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default testRouter;
