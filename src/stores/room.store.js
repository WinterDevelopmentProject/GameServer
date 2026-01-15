// roomId -> { members: Set<socketId> }
const rooms = new Map();

function getRoom(roomId) {
  return rooms.get(roomId);
}

function createRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { members: new Set() });
  }
  return rooms.get(roomId);
}

function removeRoom(roomId) {
  rooms.delete(roomId);
}

module.exports = {
  rooms,
  getRoom,
  createRoom,
  removeRoom,
};