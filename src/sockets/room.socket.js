import { roomExists, getRoom, deleteRoom } from "../stores/rooms.store.js";

function emitRoomState(io, roomId){
    const room = getRoom(roomId);
    if(!room) return;

    const players = room.players.map(p => ({
        id: p.id,
        name: p.name,
        isArtist: p.id === room.artistId ? "artist" : "viewer"
    }));

    io.to(roomId).emit("room:state", {
        roomId,
        players,
        artistId: room.artistId,
    });
}

export function registerRoomHandlers(io, socket){
    // 클라이언트가 방에 참가 요청
    socket.data.roomId = null;
    socket.data.name = null;

    socket.on("room:join", async ({roomId, name}) => {
        if(!roomExists(roomId)){
            socket.emit("room:join:error", { message: "Room does not exist." });
            return;
        }

        socket.data.roomId = roomId;
        socket.data.name = name;

        await socket.join(roomId);
        const room = getRoom(roomId);

        // 플레이어 목록에 없는지 확인 후 추가
        if(!room.players.some(p => p.id === socket.id)){
            room.players.push({
                id: socket.id,
                name: socket.data.name,
                joinedAt: Date.now(),
            });
        }

        // 처음 들어온 사람이 artist 되게 처리 (일단 임시로)
        if(!room.artistId) room.artistId = room.players[0].id;
        emitRoomState(io, roomId);

        // 참가 시 채팅/그림 전달 (쌓인거)
        socket.emit("room:history", {
            chat: room.chatHistory,
            draw: room.drawHistory,
        });
    });

    socket.on("disconnect", () => {
        const roomId = socket.data.roomId;
        if(!roomId || !getRoom(roomId)) return;

        const room = getRoom(roomId);
        room.players = room.players.filter(p => p.id !== socket.id);

        if(room.artistId === socket.id) room.artistId = room.players[0]?.id || null;
        if(room.players.length === 0){
            deleteRoom(roomId);
            return;
        }
        emitRoomState(io, roomId);
    });
}