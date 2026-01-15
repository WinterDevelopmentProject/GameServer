const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const setupSockets = require("./sockets");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // 배포 시 프론트 도메인으로 제한
  },
});

// socket 이벤트 바인딩
setupSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime server listening on :${PORT}`);
});