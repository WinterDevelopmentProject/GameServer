import {getRoom} from "../stores/rooms.store.js";

export function registerStreamHandlers(io, socket){
    // 채팅 메세지
    socket.on("chat:send", ({roomId, message}) => {
        const room = getRoom(roomId);
        if(!room) return;

        const payload = {
            from: socket.id,
            message,
            ts: Date.now(),
        };
        room.chatHistory.push(payload);
        io.to(roomId).emit("chat:message", payload);
    });

    // 그림 데이터
    socket.on("draw:buffer", ({roomId, buffer}) => {
        const room = getRoom(roomId);
        if(!room) return;

        if (socket.id !== room.artistId) return; // 아티스트 아니면 무시
        room.drawHistory.push(buffer);

        socket.to(roomId).emit("draw:buffer", {from: socket.id, buffer});
    });
}