import express from "express";
import {createRoom, roomExists} from "../stores/rooms.store.js";
import {generateRoomCode} from "../utils/roomCode.js";

const router = express.Router();

// POST /rooms : 방 생성 API
router.post("/", (req, res) => {
    let roomId;
    do {
        roomId = generateRoomCode();
    } while (roomExists(roomId));

    const room = createRoom(roomId);
    res.status(201).json({ roomId: room.roomId });
});

// POST /rooms/:roomId/join : 방 참가 가능 여부 확인
router.post("/:roomId/join", (req, res) => {
    const { roomId } = req.params;
    res.json({ exists: roomExists(roomId) });
});

export default router;