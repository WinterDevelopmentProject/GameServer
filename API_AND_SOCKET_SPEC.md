
# API & Socket Specification
프론트엔드용 명세 (현재 진행 상황 기준).

GPT로 작성함

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
````

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
  "ok": true
}
```

#### Response (실패)

```json
{
  "ok": false
}
```

#### 사용 목적

* 사용자가 입력한 방 코드가 **서버에 존재하는 방인지** 확인한다.
* `ok === true`일 때만 Socket `room:join`을 수행해야 한다.

---

### 1.3 헬스 체크 (옵션)

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
  "name": "닉네임 (선택)"
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
  "participants": [
    { "id": "socketId1", "name": "Alice", "role": "artist" },
    { "id": "socketId2", "name": "Bob",   "role": "viewer" }
  ],
  "artistId": "socketId1"
}
```

#### 프론트 처리 규칙

* 참가자 목록 UI는 `participants` 기준으로 렌더링
* `artistId === mySocketId` 인 경우만 그림 입력 허용

---

## 3.2 그림 스트림

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
* 서버는 모든 DrawBuffer를 **순서 그대로 history에 저장**한다.

---

## 3.3 채팅 스트림

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

---

## 4. 프론트엔드 권장 플로우

닉네임도 쓸거면 입력 받아야 하는데 이건 프론트에서 알아서 ㄱㄱ
개인적으로는 방 생성 후 입력 화면 -> 방 화면 또는
방 코드 입력 -> 방 존재하면 입력 화면이 나쁘지 않은듯

### 4.1 방 생성

1. `POST /rooms`
2. 응답으로 `roomId` 획득
3. Socket 연결
4. `room:join` 이벤트 전송
5. `room:history` → 초기 렌더
6. `room:state` → 참가자/권한 표시

---

### 4.2 방 참가

1. 사용자 방 코드 입력
2. `POST /rooms/{roomId}/join`
3. `ok === true` 확인
4. Socket 연결
5. `room:join` 이벤트 전송
6. 이후 흐름 동일

---

## 5. 참고 사항

* 참가/탈주/그리기 권한 변경 시마다 `room:state`가 자동으로 브로드캐스트 됨.
```