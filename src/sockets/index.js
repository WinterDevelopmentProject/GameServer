import { registerRoomHandlers } from "./room.socket.js";
import { registerStreamHandlers } from "./stream.socket.js";

// 소켓 이벤트 등록용 함수
// 추후 자동 등록으로 수정 가능

export default function setupSockets(io) {
  io.on("connection", (socket) => {
    registerRoomHandlers(io, socket);
    registerStreamHandlers(io, socket);
  });
}
