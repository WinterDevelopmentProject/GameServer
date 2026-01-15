const { createRoom, getRoom } = require("../stores/room.store");

function joinRoom(roomId, socketId) {
  const room = createRoom(roomId);
  room.members.add(socketId);
  return room;
}

function leaveRoom(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return;

  room.members.delete(socketId);
  if (room.members.size === 0) {
    // 방 비면 자동 삭제
    return true;
  }
  return false;
}

module.exports = {
  joinRoom,
  leaveRoom,
};