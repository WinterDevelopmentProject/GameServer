/**
 * 게임 메타데이터 및 레지스트리
 * 모든 게임의 정보와 로직 모듈을 관리
 */

import drawingQuiz from './drawingQuiz/index.js';

// 게임 메타데이터
const gamesMetadata = {
    drawingQuiz: {
        id: 'drawingQuiz',
        name: '그림 퀴즈',
        minPlayers: 2,
        maxPlayers: 12,
        description: '단어를 그려서 맞히는 게임. 모든 플레이어가 돌아가며 그리고, 맞춘 순서와 정확도에 따라 점수를 획득합니다.'
    }
};

// 게임 로직 모듈
const gamesLogic = {
    drawingQuiz: drawingQuiz
};

/**
 * 모든 게임의 메타데이터 조회
 * @returns {Array} 게임 메타데이터 배열
 */
export function getAllGames() {
    return Object.values(gamesMetadata);
}

/**
 * 특정 게임의 메타데이터 조회
 * @param {string} gameId - 게임 id
 * @returns {Object} 게임 메타데이터
 */
export function getGameMetadata(gameId) {
    return gamesMetadata[gameId];
}

/**
 * 특정 게임의 로직 모듈 조회
 * @param {string} gameId - 게임 id
 * @returns {Object} 게임 로직 모듈
 */
export function getGameLogic(gameId) {
    return gamesLogic[gameId];
}

/**
 * 게임 존재 여부 확인
 * @param {string} gameId - 게임 id
 * @returns {boolean}
 */
export function gameExists(gameId) {
    return gameId in gamesMetadata;
}
