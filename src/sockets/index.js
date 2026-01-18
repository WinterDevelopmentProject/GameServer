const crypto = require("crypto");
// [TEMP] Test App Store
const store = require("../temp/memory.store");

const registerRoomHandlers = require("./rooms.socket");
const registerChatHandlers = require("./chat.socket");
const registerPingHandlers = require("./ping.socket");

// [TEMP] Global broadcast for Test App
// TODO: Remove this when switching to Room-based Presence
function broadcastPresence(io) {
  io.emit("presence:list", {
    connected: store.sockets.size,
    users: store.getPublicPresenceList(),
  });
}

module.exports = function setupSockets(io) {
  io.on("connection", (socket) => {
    // [TEMP] Auth logic for Test App
    // TODO: Replace with Real Auth (JWT/Session) for Catch Mind
    const auth = socket.handshake.auth || {};
    const visitorId =
      typeof auth.visitorId === "string" && auth.visitorId.length > 0
        ? auth.visitorId
        : `anon-${crypto.randomUUID()}`;

    const name =
      typeof auth.name === "string" && auth.name.trim().length > 0
        ? auth.name.trim().slice(0, 20)
        : visitorId.slice(0, 6);

    // [TEMP] Update store
    store.addVisitor(visitorId);
    store.addSocket(socket.id, { visitorId, name });

    console.log(`connected: ${socket.id} (Visitor: ${visitorId}, Name: ${name})`);

    // Register handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerPingHandlers(io, socket);

    // [TEMP] Initial presence emission to self
    socket.emit("presence:list", {
      connected: store.sockets.size,
      users: store.getPublicPresenceList(),
    });

    // [TEMP] Broadcast presence update
    broadcastPresence(io);

    socket.on("disconnect", () => {
      console.log("disconnected:", socket.id);
      // [TEMP] Clean up store
      store.removeSocket(socket.id);
      broadcastPresence(io);
    });
  });
};