const crypto = require("crypto");

class MemoryStore {
    constructor() {
        this.startedAt = Date.now();
        this.uniqueVisitors = new Set(); // visitorId set
        this.sockets = new Map(); // socket.id -> { visitorId, name, joinedAt }
    }

    addVisitor(visitorId) {
        this.uniqueVisitors.add(visitorId);
    }

    addSocket(socketId, data) {
        this.sockets.set(socketId, { ...data, joinedAt: Date.now() });
    }

    removeSocket(socketId) {
        this.sockets.delete(socketId);
    }

    getSocket(socketId) {
        return this.sockets.get(socketId);
    }

    getPublicPresenceList() {
        return Array.from(this.sockets.values()).map((p) => ({
            visitorId: p.visitorId,
            name: p.name,
            joinedAt: p.joinedAt,
        }));
    }

    getStats() {
        return {
            startedAt: new Date(this.startedAt).toISOString(),
            uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
            uniqueVisitors: this.uniqueVisitors.size,
            connected: this.sockets.size,
        };
    }
}

// Singleton instance
module.exports = new MemoryStore();
