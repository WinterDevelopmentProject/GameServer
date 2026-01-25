/**
 * 그림 퀴즈 게임 로직
 */

import { GameInterface } from '../gameInterface.js';

// 단어 풀 (향후 데이터베이스로 확장 가능)
const WORDS = [
    '사과', '바나나', '포도', '딸기', '수박',
    '강아지', '고양이', '새', '물고기', '나비',
    '집', '자동차', '비행기', '배', '자전거',
    '해', '달', '별', '구름', '비',
    '컴퓨터', '휴대폰', '텔레비전', '냉장고', '선풍기'
];

const ROUND_TIME_SECONDS = 90; // 한 라운드 90초
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;

class DrawingQuiz extends GameInterface {
    /**
     * 게임 초기화
     */
    init(players) {
        const playerIds = players.map(p => p.id);
        
        return {
            // 게임 상태
            round: 0,
            totalRounds: playerIds.length, // 플레이어 수만큼 라운드 진행 (모두가 한번씩 그림)
            currentArtistIndex: 0,
            currentWord: null,
            roundStartTime: null,
            roundEndTime: null,
            
            // 플레이어 데이터
            playerIds: playerIds,
            playerMap: players.reduce((acc, p) => {
                acc[p.id] = { ...p, score: 0 };
                return acc;
            }, {}),
            
            // 라운드별 정답 기록
            roundAnswers: {}, // {playerId: {playerName, order}} - 정답을 맞춘 순서
            
            // 게임 채팅 (정답 마스킹용)
            chatHistory: [],
            
            // 역사 기록
            drawHistory: []
        };
    }

    /**
     * 플레이어 액션 처리
     */
    onPlayerAction(playerId, action, payload, gameData) {
        const response = {
            success: false,
            message: '',
            updatedGameData: gameData,
            broadcast: null // 방 전체에 브로드캐스트할 데이터
        };

        switch (action) {
            case 'startRound':
                return this._handleStartRound(gameData, response);
            
            case 'submitAnswer':
                return this._handleSubmitAnswer(playerId, payload, gameData, response);
            
            case 'drawStroke':
                return this._handleDrawStroke(payload, gameData, response);
            
            case 'endRound':
                return this._handleEndRound(gameData, response);
            
            case 'endGame':
                return this._handleEndGame(gameData, response);
            
            default:
                response.message = '알 수 없는 액션';
                return response;
        }
    }

    /**
     * 라운드 시작
     */
    _handleStartRound(gameData, response) {
        if (gameData.roundStartTime !== null) {
            response.message = '이미 라운드가 진행 중입니다';
            return response;
        }

        // 현재 라운드의 아티스트
        const currentArtist = gameData.playerIds[gameData.currentArtistIndex];
        
        // 랜덤 단어 선택
        gameData.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        gameData.roundStartTime = Date.now();
        gameData.roundEndTime = gameData.roundStartTime + (ROUND_TIME_SECONDS * 1000);
        gameData.roundAnswers = {};

        response.success = true;
        response.message = '라운드가 시작되었습니다';
        response.broadcast = {
            type: 'roundStarted',
            round: gameData.round + 1,
            totalRounds: gameData.totalRounds,
            currentArtistId: currentArtist,
            timeLimit: ROUND_TIME_SECONDS,
            artistName: gameData.playerMap[currentArtist].name
        };

        return response;
    }

    /**
     * 정답 제출 처리
     */
    _handleSubmitAnswer(playerId, payload, gameData, response) {
        const { answer } = payload;
        
        if (gameData.roundStartTime === null) {
            response.message = '라운드가 진행 중이지 않습니다';
            return response;
        }

        if (gameData.currentWord === null) {
            response.message = '출제 단어가 없습니다';
            return response;
        }

        // 아티스트는 정답할 수 없음
        const currentArtist = gameData.playerIds[gameData.currentArtistIndex];
        if (playerId === currentArtist) {
            response.message = '그린 사람은 정답할 수 없습니다';
            return response;
        }

        // 이미 정답한 사람은 다시 정답할 수 없음
        if (gameData.roundAnswers[playerId]) {
            response.message = '이미 정답했습니다';
            return response;
        }

        // 정답 확인 (정확성 일단 간단하게 처리, 나중에 유사도 검사 추가 가능)
        const isCorrect = answer.trim().toLowerCase() === gameData.currentWord.toLowerCase();
        
        if (isCorrect) {
            // 정답 처리
            const answerOrder = Object.keys(gameData.roundAnswers).length + 1;
            gameData.roundAnswers[playerId] = {
                playerName: gameData.playerMap[playerId].name,
                order: answerOrder
            };

            // 정답 채팅에 추가 (게임 채팅에만, 원본 채팅에는 마스킹)
            gameData.chatHistory.push({
                from: playerId,
                message: answer,
                ts: Date.now(),
                isAnswer: true
            });

            // 점수 계산: 정답한 순서에 따라 (1등: 100점, 2등: 80점, 3등: 60점...)
            const scoreTable = [100, 80, 60, 50, 40, 30, 20, 10];
            const points = scoreTable[answerOrder - 1] || 5;
            gameData.playerMap[playerId].score += points;

            response.success = true;
            response.message = `정답입니다! +${points}점`;
            response.broadcast = {
                type: 'answerSubmitted',
                playerId: playerId,
                playerName: gameData.playerMap[playerId].name,
                order: answerOrder,
                points: points,
                currentScores: this._getPlayerScores(gameData)
            };
        } else {
            // 게임 채팅에는 추가하지만 오답 처리는 하지 않음
            gameData.chatHistory.push({
                from: playerId,
                message: '(마스킹됨)',
                ts: Date.now(),
                isAnswer: false,
                originalAnswer: answer // 기록용 (나중에 로그/통계에 사용 가능)
            });

            response.success = true;
            response.message = '오답입니다';
            response.broadcast = {
                type: 'wrongAnswer',
                playerId: playerId
            };
        }

        return response;
    }

    /**
     * 그리기 스트로크 처리
     */
    _handleDrawStroke(payload, gameData, response) {
        if (gameData.drawHistory === undefined) {
            gameData.drawHistory = [];
        }

        gameData.drawHistory.push({
            type: payload.type, // 'start', 'draw', 'stop', 'clear', 'setStroke'
            data: payload.data || null
        });

        response.success = true;
        response.broadcast = {
            type: 'drawStroke',
            stroke: {
                type: payload.type,
                data: payload.data
            }
        };

        return response;
    }

    /**
     * 라운드 종료
     */
    _handleEndRound(gameData, response) {
        if (gameData.roundStartTime === null) {
            response.message = '진행 중인 라운드가 없습니다';
            return response;
        }

        // 아티스트 점수: 맞춘 사람 수에 따라 (최대 100점)
        const correctAnswersCount = Object.keys(gameData.roundAnswers).length;
        const artistPoints = Math.min(100, correctAnswersCount * 30);
        const currentArtist = gameData.playerIds[gameData.currentArtistIndex];
        gameData.playerMap[currentArtist].score += artistPoints;

        // 라운드 정보 기록
        if (!gameData.roundHistory) {
            gameData.roundHistory = [];
        }
        gameData.roundHistory.push({
            round: gameData.round + 1,
            artist: currentArtist,
            word: gameData.currentWord,
            correctAnswers: gameData.roundAnswers,
            artistPoints: artistPoints
        });

        // 다음 아티스트로
        gameData.round += 1;
        gameData.currentArtistIndex = (gameData.currentArtistIndex + 1) % gameData.playerIds.length;
        gameData.currentWord = null;
        gameData.roundStartTime = null;
        gameData.roundEndTime = null;
        gameData.drawHistory = [];

        response.success = true;
        response.message = '라운드가 종료되었습니다';
        response.broadcast = {
            type: 'roundEnded',
            round: gameData.round,
            totalRounds: gameData.totalRounds,
            scores: this._getPlayerScores(gameData),
            nextArtistId: gameData.currentArtistIndex < gameData.totalRounds ? gameData.playerIds[gameData.currentArtistIndex] : null
        };

        return response;
    }

    /**
     * 게임 종료
     */
    _handleEndGame(gameData, response) {
        const results = this._calculateFinalResults(gameData);

        response.success = true;
        response.message = '게임이 종료되었습니다';
        response.broadcast = {
            type: 'gameEnded',
            results: results
        };

        return response;
    }

    /**
     * 현재 게임 상태 조회
     */
    getGameState(gameData) {
        const currentArtist = gameData.playerIds[gameData.currentArtistIndex];
        
        return {
            round: gameData.round + 1,
            totalRounds: gameData.totalRounds,
            currentArtistId: currentArtist,
            currentArtistName: gameData.playerMap[currentArtist].name,
            timeLimit: ROUND_TIME_SECONDS,
            scores: this._getPlayerScores(gameData),
            answers: gameData.roundAnswers
        };
    }

    /**
     * 게임 종료 (end 메서드 구현)
     */
    end(gameData) {
        return {
            results: this._calculateFinalResults(gameData),
            gameData: gameData
        };
    }

    /**
     * 플레이어별 현재 점수 조회
     */
    _getPlayerScores(gameData) {
        return gameData.playerIds.map(playerId => ({
            playerId,
            playerName: gameData.playerMap[playerId].name,
            score: gameData.playerMap[playerId].score
        }));
    }

    /**
     * 최종 결과 계산
     */
    _calculateFinalResults(gameData) {
        const results = this._getPlayerScores(gameData)
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                rank: index + 1,
                playerId: player.playerId,
                playerName: player.playerName,
                totalScore: player.score
            }));

        return results;
    }
}

export default new DrawingQuiz();
