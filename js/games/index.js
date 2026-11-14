// 놀이 목록(메뉴 순서). 새 놀이는 파일을 만들고 여기에 추가하면 메뉴에 나타난다. 규격은 CLAUDE.md 참고.
// 메뉴는 8칸 × 2줄. 위 줄은 팔로 하는 놀이, 아래 줄은 온몸·다리로 하는 놀이.
import bubble from './bubble.js';
import catchGame from './catch.js';
import balloon from './balloon.js';
import apple from './apple.js';
import xylo from './xylo.js';
import clap from './clap.js';
import firework from './firework.js';
import peekaboo from './peekaboo.js';
import wipe from './wipe.js';
import paint from './paint.js';
import copy from './copy.js';
import frog from './frog.js';
import ant from './ant.js';
import bird from './bird.js';
import plane from './plane.js';
import soccer from './soccer.js';
export const GAMES = [bubble, balloon, apple, xylo, clap, firework, peekaboo, wipe, paint, catchGame, copy, frog, ant, bird, plane, soccer];
