const { joinRoom, leaveRoom } = require("../services/room.service");

module.exports = function registerRoomHandlers(io, socket) {
  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    joinRoom(roomId, socket.id);

    socket.emit("joined_room", { roomId });
    socket.to(roomId).emit("system", {
      msg: `${socket.id} joined room`,
    });
  });

  socket.on("leave_room", ({ roomId }) => {
    socket.leave(roomId);
    const shouldRemove = leaveRoom(roomId, socket.id);

    socket.to(roomId).emit("system", {
      msg: `${socket.id} left room`,
    });

    if (shouldRemove) {
      console.log(`room ${roomId} removed`);
    }
  });
};