const rooms = new Map();

export function createRoom(roomId){
    const room = {
        roomId, // 방 리스트 띄우거나 할거면 제목 추가도 괜찮을 듯.
        players: [],
        artistId: null,
        chatHistory: [],
        drawHistory: []
    };
    rooms.set(roomId, room);
    return room;
}

export function roomExists(roomId){
    return rooms.has(roomId);
}

export function getRoom(roomId){
    return rooms.get(roomId);
}

export function deleteRoom(roomId){
    rooms.delete(roomId);
}