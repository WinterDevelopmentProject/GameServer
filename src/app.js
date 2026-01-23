// src/app.js : Express 앱 파일 (API 라우팅)

import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.route.js";
import roomsRouter from "./routes/rooms.route.js";

const app = express();

app.use(cors()); // 동일 도메인 외에도 요청 허용
app.use(express.json()); // 요청 body의 JSON을 자동으로 파싱

app.use("/health", healthRouter); // 서버 Health Check용
app.use("/rooms", roomsRouter); // 방 생성 및 조회, 참가 API

export default app;