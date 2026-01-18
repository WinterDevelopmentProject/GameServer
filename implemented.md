# 구현된 기능 명세 (Implemented Features)

![Architectural Diagram](/C:/Users/ydani/.gemini/antigravity/brain/491fd694-9fe0-488c-8029-60b55de8bfe3/architectural_diagram_1768727656259.png)

요청하신 테스트 앱의 기능을 기존의 모듈식 아키텍처에 맞게 통합 구현했습니다.
(추후 `Catch Mind` 게임 개발을 위해 테스트 전용 코드는 `src/temp` 및 `[TEMP]` 주석으로 분리해 두었습니다.)

## 1. 상태 관리 (State Management)
서버의 상태를 중앙에서 관리하는 인메모리 저장소를 구현했습니다.
테스트용이므로 `src/temp`로 이동되었습니다.

- **파일**: [memory.store.js](file:///c:/Users/ydani/Desktop/GameServer/src/temp/memory.store.js)
- **주요 기능**:
    - `startedAt`: 서버 시작 시간 기록
    - `uniqueVisitors`: 방문자 고유 ID(Set) 관리
    - `sockets`: 현재 연결된 소켓 정보(Map) 관리 (Socket ID -> User Data)
    - `getStats()`: 서버 통계 데이터 반환

## 2. REST API
서버의 메타 데이터를 제공하는 API 엔드포인트를 추가했습니다.
테스트용이므로 `src/temp`로 이동되었습니다.

- **경로**: `GET /meta`
- **파일**: [meta.route.js](file:///c:/Users/ydani/Desktop/GameServer/src/temp/meta.route.js)
- **반환 데이터**:
    ```json
    {
      "ok": true,
      "startedAt": "2024-01-...",
      "uptimeSec": 123,
      "uniqueVisitors": 5,
      "connected": 2
    }
    ```

## 3. 실시간 통신 (Socket.IO)
글로벌 채팅 및 접속자 현황 기능을 소켓 레이어에 통합했습니다.
`[TEMP]` 주석을 통해 추후 교체될 로직임을 표시했습니다.

- **경로 설정**: `path: "/socket"` (기존 server.js 수정 사항)
- **진입점**: [index.js](file:///c:/Users/ydani/Desktop/GameServer/src/sockets/index.js)
    - **인증(Auth)**: `[TEMP]` 핸드셰이크 시 `visitorId`, `name`을 받아 저장소에 등록
    - **입퇴장 처리**: `[TEMP]` 연결/해제 시 `presence:list` 브로드캐스팅
- **채팅**: [chat.socket.js](file:///c:/Users/ydani/Desktop/GameServer/src/sockets/chat.socket.js)
    - `chat:send` (Client -> Server): 메시지 수신
    - `chat:message` (Server -> Client): `[TEMP]` 전체 브로드캐스트 (메시지 포맷팅 및 사용자 정보 포함)
- **핑/퐁**: [ping.socket.js](file:///c:/Users/ydani/Desktop/GameServer/src/sockets/ping.socket.js)
    - Latency 테스트를 위한 단순 응답 핸들러 추가
