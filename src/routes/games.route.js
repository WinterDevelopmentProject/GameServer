import express from "express";
import { getAllGames } from "../games/index.js";

const router = express.Router();

// GET /api/games : 모든 게임 목록 조회
router.get("/", (req, res) => {
    const games = getAllGames();
    res.json({ games });
});

export default router;
