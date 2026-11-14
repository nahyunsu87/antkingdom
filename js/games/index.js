// 게임 목록. 새 게임은 파일을 만들고 여기에 추가하면 메뉴에 나타난다.
// 게임 규격은 CLAUDE.md 의 "게임 모듈 규격" 참고.
import punch from './punch.js';
import squat from './squat.js';
import run from './run.js';
import catchGame from './catch.js';
export const GAMES = [punch, squat, run, catchGame];
