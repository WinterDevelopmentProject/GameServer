const registerRoomHandlers = require("./rooms.socket");
const registerChatHandlers = require("./chat.socket");

module.exports = function setupSockets(io) {
  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("disconnected:", socket.id);
    });
  });
};