module.exports = function registerChatHandlers(io, socket) {
  socket.on("chat", ({ roomId, msg }) => {
    io.to(roomId).emit("chat", {
      user: socket.id,
      msg,
      at: Date.now(),
    });
  });
};