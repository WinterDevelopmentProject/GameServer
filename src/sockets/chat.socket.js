const crypto = require("crypto");
// [TEMP] Test App Store
const store = require("../temp/memory.store");

// [TEMP] Global Chat Handler
// TODO: Refactor to Room-based Chat for Catch Mind
module.exports = function registerChatHandlers(io, socket) {
  socket.on("chat:send", (payload) => {
    const text = typeof payload?.text === "string" ? payload.text.trim() : "";
    if (!text) return;

    // 너무 긴 메시지 방지
    const safeText = text.slice(0, 200);
    const user = store.getSocket(socket.id);

    const msg = {
      id: crypto.randomUUID(),
      from: user?.name ?? "unknown",
      visitorId: user?.visitorId ?? "unknown",
      text: safeText,
      ts: Date.now(),
    };

    io.emit("chat:message", msg);
  });
};