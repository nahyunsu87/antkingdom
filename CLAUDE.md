# 개미 체육관

아이폰 Safari 카메라로 몸동작을 인식하는 운동 게임 4종. 폰을 TV에 화면 미러링해서 1~2명이 한다.
빌드 없음 — 정적 파일 그대로 GitHub Pages(HTTPS 필수: 카메라 권한)로 배포.

## 실행 / 테스트

```bash
python3 -m http.server 8765
```

- `http://localhost:8765/?sim` — 카메라 없이 가짜 뼈대로 실행. P1: A/D 이동, S 앉기, W 점프, Q/E 무릎, 마우스=오른손. P2: 방향키, `,` `.` 무릎
- `?sim&bot` — 가짜 플레이어가 자동으로 움직임 (헤드리스 스크린샷 테스트용)
- `&game=punch|squat|run|catch&n=1|2` — 메뉴 건너뛰고 바로 시작
- 실제 인식 품질은 실기기에서만 확인 가능. sim 통과 ≠ 아이폰에서 잘 됨.

## 구조

| 파일 | 역할 |
|---|---|
| `js/main.js` | 흐름(boot→menu→ready→count→play→result), 손 올려 누르는 버튼, 점수판, 결과 |
| `js/input.js` | 카메라 + MediaPipe PoseLandmarker(최대 2명) / 시뮬레이터 |
| `js/players.js` | 포즈→P1(왼쪽)/P2(오른쪽) 배정, 화면 좌표 변환, 떨림 보정, 파생값 |
| `js/games/*.js` | 게임별 로직. `index.js`에 등록하면 메뉴에 뜸 |
| `js/assets.js` | `assets/<key>.png` 있으면 그림, 없으면 이모지. 단색 배경 자동 제거 |
| `js/audio.js` | 합성 효과음 |
| `vendor/mediapipe/` | 포즈 라이브러리·모델 내장본(20MB). CDN 의존 없음. 수정 금지 |

## 게임 모듈 규격

```js
export default {
  id, title, desc, emoji, color, how,   // 메뉴/준비 화면 문구
  duration: 60,                         // 초
  needs: 'upper' | 'full',              // full = 무릎까지 보여야 시작
  start(c)  { return state; },
  update(state, dt, c) {},              // 사람이 없으면 엔진이 멈춰줌
  draw(state, g, c) {},                 // g = 2D context. 뼈대·점수판은 엔진이 그림
};
```

`c`: `W H u(=H/100)` `n`(인원) `players[]` `zones[]`(플레이어별 화면 구역 {x,w,cx}) `score[]` `t` `dur`
`pop(x,y,글자,색)` `sprite(key,이모지,x,y,크기)` `text(...)` `sfx` `finish()`

`players[i]`: `present cx nose shoulder hip hands[2] knees[2] ankles[2] sw torso lm[33]`

## 지켜야 할 것

- 크기·거리는 px 고정값 금지. 사람 기준은 `p.sw`/`p.torso`, 화면 기준은 `c.u`/`c.H`. (사람마다 카메라 거리가 다름)
- 타이밍 판정은 0.4초 이상 여유. AirPlay 미러링 지연이 0.1~0.3초 있음.
- 게임 중 조작은 몸으로만. 터치는 "✕ 메뉴"뿐. 손 버튼은 든 손이 닿는 화면 위쪽 절반에만 배치.
- TV에서 2~3m 떨어져 읽으므로 글자는 `u*4` 이상.
- 한 프레임에 포즈 추론이 20~40ms 든다. draw에서 그림자·블러·큰 그라디언트 남발 금지.

## 다음 작업 후보 (실기기 테스트 후 우선순위 정할 것)

1. 실기기 튜닝: 각 게임의 문턱값(`squat.js` 0.45/0.12, `run.js` TH, `punch.js` reach) — 실제 사람 데이터로 조정
2. 2인 인식 안정화: 두 사람이 교차하면 P1/P2가 바뀜(현재는 단순 좌우 정렬)
3. 게임별 연출: 타격 파티클, 배경 그림, 배경음악, 난이도 선택
4. 운동량 기록: 세션별 걸음/스쿼트/타격 횟수 누적(localStorage)
5. 홈 화면 추가용 manifest·아이콘, 오프라인 캐시(service worker)
