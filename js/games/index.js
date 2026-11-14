// 놀이 목록. 새 놀이는 파일을 만들고 여기에 추가하면 메뉴에 나타난다. 규격은 CLAUDE.md 참고.
import bubble from './bubble.js';
import catchGame from './catch.js';
import ant from './ant.js';
import copy from './copy.js';
export const GAMES = [bubble, catchGame, ant, copy];
