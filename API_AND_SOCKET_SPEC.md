# API & Socket Specification

프론트엔드용 명세 (현재 진행 상황 기준).

---

## 1. REST API 명세

### 1.1 방 생성

- **Method**: `POST`
- **Path**: `/rooms`
- **Request Body**: 없음

#### Response
```json
{
  "roomId": "A9F3KQ"
}
```

#### 사용 목적

* 새로운 게임 방을 생성한다.
* 생성된 `roomId`는 사용자에게 공유되는 고유 코드이다.
* 실제 실시간 입장은 Socket 이벤트 `room:join`으로 수행한다.

---

### 1.2 방 참가 가능 여부 확인

* **Method**: `POST`
* **Path**: `/rooms/{roomId}/join`
* **Request Body**: 없음

#### Response (성공)

```json
{
  "exists": true
}
```

#### Response (실패)

```json
{
  "exists": false
}
```

#### 사용 목적

* 사용자가 입력한 방 코드가 **서버에 존재하는 방인지** 확인한다.
* `exists === true`일 때만 Socket `room:join`을 수행해야 한다.

---

### 1.3 게임 목록 조회

* **Method**: `GET`
* **Path**: `/api/games`
* **Request Body**: 없음

#### Response

```json
{
  "games": [
    {
      "id": "drawingQuiz",
      "name": "그림 퀴즈",
      "minPlayers": 2,
      "maxPlayers": 12,
      "description": "단어를 그려서 맞히는 게임. 모든 플레이어가 돌아가며 그리고, 맞춘 순서와 정확도에 따라 점수를 획득합니다."
    }
  ]
}
```

#### 사용 목적

* 로비 화면이나 메인 화면에서 사용 가능한 게임 목록을 조회한다.
* 각 게임의 이름, 플레이어 수 제한, 설명 등을 표시한다.

---

### 1.4 헬스 체크 (옵션)

* **Method**: `GET`
* **Path**: `/health`

---

## 2. Socket.IO 연결

### 2.1 기본 설정

* Socket.IO 서버 path: **`/socket`**
* 서버는 HTTP API와 동일한 도메인/포트를 사용한다.

---

## 3. Socket 이벤트 명세

### 3.1 방 참가

#### Client → Server

**Event**: `room:join`

```json
{
  "roomId": "A9F3KQ",
  "name": "닉네임"
}
```

#### Server → Client (개별 응답)

##### Event: `room:history`

```json
{
  "chat": [
    {
      "from": "socketId",
      "message": "안녕하세요",
      "ts": 1730000000000
    }
  ],
  "draw": [
    {
      "type": "start",
      "data": { "x": 10, "y": 20 }
    },
    {
      "type": "setStroke",
      "data": { "color": "#000000", "width": 4 }
    }
  ]
}
```

* 방에 처음 입장했을 때 서버가 현재까지의 히스토리를 제공한다.

---

#### Server → Room (브로드캐스트)

##### Event: `room:state`

```json
{
  "roomId": "A9F3KQ",
  "players": [
    { "id": "socketId1", "name": "Alice", "isArtist": "artist" },
    { "id": "socketId2", "name": "Bob",   "isArtist": "viewer" }
  ],
  "artistId": "socketId1",
  "gameState": "LOBBY",
  "selectedGame": null
}
```

#### 프론트 처리 규칙

* 참가자 목록 UI는 `players` 기준으로 렌더링
* `artistId === mySocketId` 인 경우만 그림 입력 허용 (게임 진행 중에만)
* `gameState`에 따라 화면 전환 (LOBBY → 로비 화면, IN_GAME → 게임 진행, RESULT → 결과 화면)
* `selectedGame`이 `null`이 아니면 게임이 선택된 상태

---

## 3.2 게임 선택

#### Client → Server

**Event**: `game:select`

```json
{
  "roomId": "A9F3KQ",
  "gameId": "drawingQuiz"
}
```

#### Server → Client

**Success Event**: `game:select:success` 또는 `room:state` (selectedGame 포함)

**Error Event**: `game:select:error`

```json
{
  "message": "게임이 진행 중입니다."
}
```

#### 조건

* `gameState`가 `LOBBY`일 때만 가능
* 모든 플레이어가 LOBBY 상태여야 함

---

## 3.3 게임 시작

#### Client → Server

**Event**: `game:start`

```json
{
  "roomId": "A9F3KQ"
}
```

#### Server → Room (브로드캐스트)

**Event**: `game:started`

```json
{
  "gameId": "drawingQuiz",
  "gameState": {
    "round": 1,
    "totalRounds": 4,
    "currentArtistId": "socketId1",
    "currentArtistName": "Alice",
    "timeLimit": 90,
    "scores": [
      { "playerId": "socketId1", "playerName": "Alice", "score": 0 },
      { "playerId": "socketId2", "playerName": "Bob", "score": 0 }
    ]
  }
}
```

**Also**: `room:state` (gameState가 'IN_GAME'으로 변경)

#### 조건

* `gameState`가 `LOBBY`일 때만 가능
* `selectedGame`이 설정되어 있어야 함

---

## 3.4 게임 액션 (게임 진행)

#### Client → Server

**Event**: `game:action`

```json
{
  "roomId": "A9F3KQ",
  "action": "submitAnswer",
  "payload": {
    "answer": "사과"
  }
}
```

#### 그림 퀴즈의 주요 액션

| Action | Payload | 설명 |
|--------|---------|------|
| `startRound` | `{}` | 라운드 시작 |
| `submitAnswer` | `{answer: string}` | 정답 제출 |
| `drawStroke` | `{type, data}` | 그리기 스트로크 (draw:buffer와 동일) |
| `endRound` | `{}` | 라운드 종료 |
| `endGame` | `{}` | 게임 종료 |

#### Server → Client

**Success Event**: `game:action:success`

```json
{
  "message": "정답입니다! +100점"
}
```

**Broadcast Event**: `game:broadcast` (모든 플레이어)

```json
{
  "type": "answerSubmitted",
  "playerId": "socketId2",
  "playerName": "Bob",
  "order": 1,
  "points": 100,
  "currentScores": [
    { "playerId": "socketId1", "playerName": "Alice", "score": 0 },
    { "playerId": "socketId2", "playerName": "Bob", "score": 100 }
  ]
}
```

**Error Event**: `game:action:error`

```json
{
  "message": "오답입니다"
}
```

---

## 3.5 게임 종료

#### Client → Server

**Event**: `game:end`

```json
{
  "roomId": "A9F3KQ"
}
```

#### Server → Room (브로드캐스트)

**Event**: `game:ended`

```json
{
  "results": [
    {
      "rank": 1,
      "playerId": "socketId2",
      "playerName": "Bob",
      "totalScore": 180
    },
    {
      "rank": 2,
      "playerId": "socketId1",
      "playerName": "Alice",
      "totalScore": 120
    }
  ]
}
```

**Also**: `room:state` (gameState가 'RESULT'로 변경)

---

## 3.6 결과 화면에서 로비로 돌아가기

#### Client → Server

**Event**: `result:returnToLobby`

```json
{
  "roomId": "A9F3KQ"
}
```

#### Server → Client

**Success Event**: `result:returnToLobby:success`

```json
{
  "message": "로비로 돌아갔습니다"
}
```

**프론트 처리**: 해당 클라이언트는 로비 화면으로 이동. 다른 플레이어는 여전히 결과 화면.

#### 조건

* `gameState`가 `RESULT`일 때만 가능
* 개별 플레이어만 로비로 돌아가고, 서버 방의 gameState는 유지

---

## 3.7 그림 스트림

### DrawBuffer 형식

```ts
interface DrawBuffer {
  type: 'start' | 'draw' | 'stop' | 'clear' | 'setStroke';
  data?: { x: number; y: number } | { color: string; width: number };
}
```

---

#### Client → Server

**Event**: `draw:buffer`

```json
{
  "roomId": "A9F3KQ",
  "buffer": {
    "type": "draw",
    "data": { "x": 12, "y": 34 }
  }
}
```

> 서버는 **artist 권한을 가진 사용자만** 이 이벤트를 처리한다.
> 게임 진행 중에만 처리됨.

---

#### Server → Room (본인 제외 브로드캐스트)

**Event**: `draw:buffer`

```json
{
  "from": "socketId",
  "buffer": {
    "type": "draw",
    "data": { "x": 12, "y": 34 }
  }
}
```

* `clear` 이벤트도 동일하게 전달된다.
* 서버는 모든 DrawBuffer를 **순서 그대로 gameData.drawHistory에 저장**한다.

---

## 3.8 채팅 스트림

#### Client → Server

**Event**: `chat:send`

```json
{
  "roomId": "A9F3KQ",
  "message": "안녕하세요"
}
```

---

#### Server → Room

**Event**: `chat:message`

```json
{
  "from": "socketId",
  "message": "안녕하세요",
  "ts": 1730000000000
}
```

#### 프론트 처리 규칙

* `room:history.chat`을 먼저 로드
* 이후 수신되는 `chat:message`를 append
* 게임 진행 중(IN_GAME)에는 정답이 마스킹되어 표시됨 (그림 퀴즈의 경우)

---

## 4. 게임 상태 흐름

```
LOBBY (게임 미선택)
  ↓ game:select
LOBBY (게임 선택됨, selectedGame 설정)
  ↓ game:start
IN_GAME (게임 진행 중)
  ↓ game:end (모든 라운드 완료)
RESULT (결과 표시)
  ↓ result:returnToLobby (개별 플레이어)
LOBBY (개별 플레이어)
```

---

## 5. 프론트엔드 권장 플로우

### 5.1 방 생성 및 게임 시작

1. `POST /rooms` → roomId 획득
2. Socket 연결
3. `room:join` 이벤트 전송
4. `room:history` → 초기 렌더
5. `room:state` → 참가자 표시 (LOBBY 상태)
6. `GET /api/games` → 게임 목록 조회
7. 게임 선택 후 `game:select` 이벤트
8. `room:state` 업데이트 (selectedGame 표시)
9. 모든 플레이어가 준비되면 `game:start` 이벤트
10. `game:started` → 게임 진행 화면으로 전환

### 5.2 방 참가

1. 사용자 방 코드 입력
2. `POST /rooms/{roomId}/join` → 방 존재 확인
3. Socket 연결
4. `room:join` 이벤트 전송
5. 이후 흐름 동일 (이미 게임이 진행 중이면 IN_GAME 또는 RESULT 상태)

### 5.3 게임 진행 중 입장

* `gameState`가 `IN_GAME` 또는 `RESULT`일 때는 새 플레이어 입장 불가
* 프론트에서 방 존재 확인 후 "게임이 진행 중입니다" 메시지 표시

---

## 6. 참고 사항

* 참가/탈주 시마다 `room:state`가 자동으로 브로드캐스트 됨.
* 게임 상태(`gameState`, `selectedGame`) 변경 시에도 `room:state` 이벤트 발생.
* 게임별로 `gameData` 구조가 다르므로, 클라이언트는 게임별 문서를 참고해야 함.
