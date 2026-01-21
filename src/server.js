// src/server.js : 서버 진입점

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import setupSockets from "./sockets/index.js";

const server = http.createServer(app);

// 프론트랑 동일 도메인 + path로 /socket 사용 (수정 X)
const io = new Server(server, { cors: { origin: "*" }, path: "/socket" });

// socket 이벤트 바인딩
setupSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime server listening on :${PORT}`);
});