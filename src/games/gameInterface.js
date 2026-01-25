/**
 * 모든 게임 모듈이 구현해야 하는 공통 인터페이스
 * 각 게임은 이 인터페이스를 따라 구현되어야 함
 */

export class GameInterface {
    /**
     * 게임 초기화
     * @param {Array} players - [{id, name}, ...] 형식의 플레이어 배열
     * @returns {Object} gameData 객체 (게임별 커스텀 필드 포함)
     */
    init(players) {
        throw new Error('init() must be implemented');
    }

    /**
     * 플레이어 액션 처리
     * @param {string} playerId - 액션을 수행한 플레이어의 id (socketId)
     * @param {string} action - 액션 타입 (e.g., 'submitAnswer', 'drawStroke')
     * @param {Object} payload - 액션에 대한 데이터
     * @param {Object} gameData - 현재 게임 상태
     * @returns {Object} {success, message, updatedGameData, broadcast} 형식
     */
    onPlayerAction(playerId, action, payload, gameData) {
        throw new Error('onPlayerAction() must be implemented');
    }

    /**
     * 현재 게임 상태 조회
     * @param {Object} gameData - 현재 게임 상태
     * @returns {Object} 클라이언트에 전달할 게임 상태
     */
    getGameState(gameData) {
        throw new Error('getGameState() must be implemented');
    }

    /**
     * 게임 종료
     * @param {Object} gameData - 현재 게임 상태
     * @returns {Object} {results, ...} 형식의 최종 결과
     */
    end(gameData) {
        throw new Error('end() must be implemented');
    }
}
