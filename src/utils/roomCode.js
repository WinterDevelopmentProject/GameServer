const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 가능한 문자 제외
const CODE_LENGTH = 6; // 기본 방 코드 길이

export function generateRoomCode(length = CODE_LENGTH) {
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * ALPHABET.length);
        result += ALPHABET[randomIndex];
    }
    return result;
}