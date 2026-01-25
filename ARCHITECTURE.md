# GameServer 아키텍처 문서

## 개요

GameServer는 다양한 게임을 지원하는 실시간 멀티플레이어 게임 서버입니다. Express.js와 Socket.io를 기반으로 하며, 확장 가능한 게임 로직 모듈 시스템을 제공합니다.

## 시스템 아키텍처

### 폴더 구조

```
GameServer/
├── src/
│   ├── app.js                 # Express 앱 설정 (라우팅)
│   ├── server.js              # 서버 진입점
│   ├── routes/                # REST API 라우트
│   │   ├── health.route.js    # 헬스 체크
│   │   ├── rooms.route.js     # 방 생성/조회 API
│   │   └── games.route.js     # 게임 목록 API
│   ├── sockets/               # Socket.io 이벤트 핸들러
│   │   ├── index.js           # Socket 설정
│   │   ├── room.socket.js     # 방 관련 및 게임 관련 이벤트
│   │   └── stream.socket.js   # 드로잉/채팅 실시간 스트림
│   ├── stores/                # 데이터 저장소 (현재 메모리 기반)
│   │   └── rooms.store.js     # 방 정보 저장
│   ├── games/                 # 게임 로직 모듈
│   │   ├── index.js           # 게임 레지스트리
│   │   ├── gameInterface.js   # 게임 인터페이스 정의
│   │   └── drawingQuiz/       # 그림 퀴즈 게임
│   │       ├── index.js       # 게임 로직 구현
│   │       └── README.md      # 게임 규칙 설명서
│   └── utils/
│       └── roomCode.js        # 방 코드 생성 유틸리티
├── package.json
└── README.md
```

## 데이터 모델

### Room (방)

```javascript
{
  roomId: string,              // 고유 방 ID (e.g., "A9F3KQ")
  players: [                   // 참가자 목록
    {
      id: string,              // 소켓 ID
      name: string,            // 플레이어 닉네임
      joinedAt: number         // 참가 시간 (타임스탬프)
    },
    ...
  ],
  artistId: string | null,     // 현재 그린 사람 (그림 기능용)
  chatHistory: [               // 전체 채팅 이력
    {
      from: string,            // 보낸 사람 소켓 ID
      message: string,         // 메시지 내용
      ts: number               // 타임스탬프
    },
    ...
  ],
  gameState: string,           // 'LOBBY' | 'IN_GAME' | 'RESULT'
  selectedGame: string | null, // 선택된 게임 ID (e.g., 'drawingQuiz')
  gameData: {                  // 게임별 커스텀 데이터
    // 게임마다 구조가 다름
    // 예: 그림 퀴즈는 drawHistory, currentWord, playerScores 등 포함
  }
}
```

## 게임 시스템

### 게임 레지스트리 (games/index.js)

모든 게임의 메타데이터와 로직 모듈을 중앙에서 관리합니다.

**게임 메타데이터 형식:**
```javascript
{
  id: string,                  // 게임 고유 ID
  name: string,                // 게임 이름
  minPlayers: number,          // 최소 플레이어 수
  maxPlayers: number,          // 최대 플레이어 수
  description: string          // 게임 설명
}
```

### 게임 인터페이스 (GameInterface)

모든 게임 모듈이 구현해야 하는 공통 인터페이스입니다.

```javascript
class GameInterface {
  // 게임 초기화 - gameData 생성
  init(players) { }
  
  // 플레이어 액션 처리 (submitAnswer, drawStroke 등)
  onPlayerAction(playerId, action, payload, gameData) { }
  
  // 현재 게임 상태 반환 (클라이언트에 전달)
  getGameState(gameData) { }
  
  // 게임 종료 및 결과 계산
  end(gameData) { }
}
```

### 그림 퀴즈 게임 (drawingQuiz)

모든 플레이어가 돌아가며 주어진 단어를 그리고, 다른 플레이어들이 채팅으로 정답을 맞히는 게임입니다.

**상태 구조:**
```javascript
{
  round: number,               // 현재 라운드
  totalRounds: number,         // 전체 라운드
  currentArtistIndex: number,  // 현재 그린 사람 인덱스
  currentWord: string | null,  // 출제 단어
  roundStartTime: number,      // 라운드 시작 시간
  roundEndTime: number,        // 라운드 예상 종료 시간
  playerIds: [string],         // 플레이어 ID 배열
  playerMap: {                 // 플레이어별 정보
    [playerId]: {
      id: string,
      name: string,
      score: number            // 누적 점수
    }
  },
  roundAnswers: {              // 현재 라운드의 정답 기록
    [playerId]: {
      playerName: string,
      order: number            // 정답 순서
    }
  },
  chatHistory: [],             // 게임 채팅 (정답 마스킹됨)
  drawHistory: []              // 그림 스트로크 기록
}
```

## REST API

### 게임 목록 조회

**엔드포인트:** `GET /api/games`

**응답:**
```json
{
  "games": [
    {
      "id": "drawingQuiz",
      "name": "그림 퀴즈",
      "minPlayers": 2,
      "maxPlayers": 12,
      "description": "단어를 그려서 맞히는 게임..."
    }
  ]
}
```

## Socket.io 이벤트

### 게임 선택

**클라이언트 → 서버:**
```javascript
socket.emit("game:select", {
  roomId: string,   // 방 ID
  gameId: string    // 게임 ID
});
```

**서버 → 클라이언트:**
- 성공: `game:select:success` 또는 `room:state` (gameState, selectedGame 포함)
- 실패: `game:select:error` (message 포함)

### 게임 시작

**클라이언트 → 서버:**
```javascript
socket.emit("game:start", {
  roomId: string
});
```

**서버 → 방의 모든 클라이언트:**
```javascript
// game:started
{
  gameId: string,
  gameState: {} // 게임별 상태 정보
}

// room:state (gameState가 'IN_GAME'으로 변경됨)
```

### 게임 액션 (게임별 커스텀 액션)

**클라이언트 → 서버:**
```javascript
socket.emit("game:action", {
  roomId: string,
  action: string,   // 'submitAnswer', 'drawStroke', 'startRound' 등
  payload: {}       // 액션별 데이터
});
```

**그림 퀴즈의 주요 액션:**
- `startRound`: 라운드 시작
- `submitAnswer`: 정답 제출 (payload: {answer: string})
- `drawStroke`: 그리기 스트로크 (payload: {type, data})
- `endRound`: 라운드 종료
- `endGame`: 게임 종료

**서버 → 클라이언트:**
- 성공: `game:action:success` 또는 `game:broadcast` (모든 플레이어에게)
- 실패: `game:action:error` (message 포함)

### 게임 종료

**클라이언트 → 서버:**
```javascript
socket.emit("game:end", {
  roomId: string
});
```

**서버 → 방의 모든 클라이언트:**
```javascript
// game:ended
{
  results: [
    {
      rank: number,
      playerId: string,
      playerName: string,
      totalScore: number
    },
    ...
  ]
}

// room:state (gameState가 'RESULT'로 변경됨)
```

### 결과 화면에서 로비로 돌아가기

**클라이언트 → 서버:**
```javascript
socket.emit("result:returnToLobby", {
  roomId: string
});
```

**서버 → 해당 클라이언트:**
- 성공: `result:returnToLobby:success`
- 실패: `result:returnToLobby:error`

## 게임 상태 흐름

```
LOBBY (게임 선택 가능)
  ↓
  게임 선택 (game:select)
  ↓
IN_GAME (게임 진행)
  ↓
  라운드 반복 (startRound → submitAnswer/drawStroke → endRound)
  ↓
  게임 종료 (game:end)
  ↓
RESULT (결과 표시)
  ↓
  returnToLobby (개별 플레이어가 로비로 돌아감)
  ↓
  모두 로비로 돌아가면 다시 LOBBY 상태
```

## 확장 가능성

### 새로운 게임 추가 방법

1. **게임 폴더 생성:** `src/games/{gameId}/` 디렉토리 생성
2. **게임 로직 구현:** GameInterface를 상속하여 `index.js` 작성
3. **메타데이터 등록:** `src/games/index.js`의 `gamesMetadata`와 `gamesLogic`에 추가
4. **문서 작성:** 게임 규칙을 `README.md`에 기록

## 주의사항

- **메모리 기반 저장소:** 현재 Room 데이터는 메모리에만 저장됨. 프로덕션 환경에서는 데이터베이스 통합 필요
- **동시 입장 차단:** `gameState`가 `IN_GAME` 또는 `RESULT`일 때 새 플레이어 입장 불가
- **클라이언트별 상태:** 결과 화면에서 각 클라이언트가 자신의 로컬 상태를 관리 (서버는 방의 상태만 유지)

## 향후 개선사항

- [ ] 데이터베이스 연동 (방 이력, 플레이어 통계)
- [ ] 인증/인가 시스템
- [ ] 게임 설정 커스터마이징
- [ ] 옵저버/스펙테이터 모드
- [ ] 게임 로비에서 관전 기능
- [ ] 점수 시스템 통일화
- [ ] 게임별 설정 파일 (난이도, 시간 제한 등)
