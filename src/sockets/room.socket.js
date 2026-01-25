import { roomExists, getRoom, deleteRoom } from "../stores/rooms.store.js";
import { getGameLogic, gameExists } from "../games/index.js";

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
        gameState: room.gameState,
        selectedGame: room.selectedGame,
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

        const room = getRoom(roomId);
        
        // 게임 진행 중이거나 결과 화면에서는 입장 불가
        if(room.gameState === 'IN_GAME' || room.gameState === 'RESULT'){
            socket.emit("room:join:error", { message: "게임이 진행 중입니다. 다시 시도해주세요" });
            return;
        }

        socket.data.roomId = roomId;
        socket.data.name = name;

        await socket.join(roomId);

        // 플레이어 목록에 없는지 확인 후 추가
        if(!room.players.some(p => p.id === socket.id)){
            room.players.push({
                id: socket.id,
                name: socket.data.name,
                joinedAt: Date.now(),
            });
        }

        // 처음 들어온 사람이 artist 되게 처리 (일단 임시로, 게임 진행 중에는 다시 설정)
        if(!room.artistId && room.players.length > 0) room.artistId = room.players[0].id;
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

export function registerGameHandlers(io, socket){
    // 게임 선택
    socket.on("game:select", ({roomId, gameId}) => {
        if(!roomExists(roomId)){
            socket.emit("game:select:error", { message: "Room does not exist." });
            return;
        }

        if(!gameExists(gameId)){
            socket.emit("game:select:error", { message: "Game does not exist." });
            return;
        }

        const room = getRoom(roomId);
        
        // 모든 플레이어가 LOBBY 상태여야 함
        if(room.gameState !== 'LOBBY'){
            socket.emit("game:select:error", { message: "게임이 진행 중입니다." });
            return;
        }

        room.selectedGame = gameId;
        emitRoomState(io, roomId);
        socket.emit("game:select:success", { gameId });
    });

    // 게임 시작
    socket.on("game:start", ({roomId}) => {
        if(!roomExists(roomId)){
            socket.emit("game:start:error", { message: "Room does not exist." });
            return;
        }

        const room = getRoom(roomId);
        
        if(room.gameState !== 'LOBBY'){
            socket.emit("game:start:error", { message: "이미 게임이 진행 중입니다." });
            return;
        }

        if(!room.selectedGame){
            socket.emit("game:start:error", { message: "선택된 게임이 없습니다." });
            return;
        }

        // 게임 로직 모듈 조회
        const gameLogic = getGameLogic(room.selectedGame);
        if(!gameLogic){
            socket.emit("game:start:error", { message: "게임 로직을 찾을 수 없습니다." });
            return;
        }

        // 게임 초기화
        const players = room.players.map(p => ({id: p.id, name: p.name}));
        room.gameData = gameLogic.init(players);
        room.gameState = 'IN_GAME';

        io.to(roomId).emit("game:started", {
            gameId: room.selectedGame,
            gameState: gameLogic.getGameState(room.gameData)
        });
        emitRoomState(io, roomId);
    });

    // 게임 액션 (게임별 커스텀 액션)
    socket.on("game:action", ({roomId, action, payload}) => {
        if(!roomExists(roomId)){
            socket.emit("game:action:error", { message: "Room does not exist." });
            return;
        }

        const room = getRoom(roomId);
        if(room.gameState !== 'IN_GAME'){
            socket.emit("game:action:error", { message: "게임이 진행 중이 아닙니다." });
            return;
        }

        const gameLogic = getGameLogic(room.selectedGame);
        if(!gameLogic){
            socket.emit("game:action:error", { message: "게임 로직을 찾을 수 없습니다." });
            return;
        }

        const response = gameLogic.onPlayerAction(socket.id, action, payload, room.gameData);
        
        if(response.success){
            socket.emit("game:action:success", { message: response.message });
            
            // 브로드캐스트
            if(response.broadcast){
                io.to(roomId).emit("game:broadcast", response.broadcast);
            }
        } else {
            socket.emit("game:action:error", { message: response.message });
        }
    });

    // 게임 종료
    socket.on("game:end", ({roomId}) => {
        if(!roomExists(roomId)){
            socket.emit("game:end:error", { message: "Room does not exist." });
            return;
        }

        const room = getRoom(roomId);
        if(room.gameState !== 'IN_GAME'){
            socket.emit("game:end:error", { message: "게임이 진행 중이 아닙니다." });
            return;
        }

        const gameLogic = getGameLogic(room.selectedGame);
        const result = gameLogic.end(room.gameData);
        
        room.gameState = 'RESULT';
        io.to(roomId).emit("game:ended", {
            results: result.results
        });
        emitRoomState(io, roomId);
    });

    // 결과 화면에서 로비로 돌아가기
    socket.on("result:returnToLobby", ({roomId}) => {
        if(!roomExists(roomId)){
            socket.emit("result:returnToLobby:error", { message: "Room does not exist." });
            return;
        }

        const room = getRoom(roomId);
        // 개별 플레이어는 로비로, 서버 상태는 유지
        socket.emit("result:returnToLobby:success", {
            message: "로비로 돌아갔습니다"
        });

        // 모든 플레이어가 로비로 돌아갔는지 확인 (모두 연결 해제되면 자동 정리)
    });
}