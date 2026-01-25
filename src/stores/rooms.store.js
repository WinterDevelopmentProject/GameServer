const rooms = new Map();

export function createRoom(roomId){
    const room = {
        roomId,
        players: [], // [{id, name, joinedAt}, ...]
        artistId: null,
        chatHistory: [], // [{from, message, ts}, ...]
        gameState: 'LOBBY', // LOBBY | IN_GAME | RESULT
        selectedGame: null, // 선택된 게임 id (e.g., 'drawingQuiz')
        gameData: {} // 게임별 커스텀 데이터 (drawHistory 포함)
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