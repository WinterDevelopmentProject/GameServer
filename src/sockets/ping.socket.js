module.exports = function registerPingHandlers(io, socket) {
    socket.on("ping", () => {
        socket.emit("pong", { ts: Date.now() });
    });
};
