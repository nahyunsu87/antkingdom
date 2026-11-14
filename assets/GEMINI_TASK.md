# 작업 지시서: 제미나이 웹으로 놀이 그림 그리기

이 작업은 **사용자 맥북에서 도는 Claude**(Claude 데스크톱 앱, Claude in Chrome 사용 가능)가 한다.
클라우드 세션은 맥북 화면·Chrome에 닿을 수 없어서 여기서 나눠 맡긴다.

## 목표

`assets/README.md` 표에 있는 그림 52장을 **제미나이 웹(gemini.google.com)** 에서 한 화풍으로 그려
`assets/<파일명>.png`로 저장하고, 게임에서 제대로 보이는지 확인한 뒤 GitHub에 올린다.
API 말고 제미나이 웹을 쓴다(사용자 요청: 기존 구독을 쓰기 위해).

## 순서

1. 저장소 받기: `git clone https://github.com/nahyunsu87/antkingdom.git` 후 그 폴더에서 작업. 브랜치는 `gemini-art`.
2. Claude in Chrome으로 gemini.google.com 열기(사용자 계정으로 로그인돼 있음). **새 대화 하나**에서 전부 그린다(화풍 유지).
3. 첫 요청은 `assets/README.md`의 "첫 요청 예시"를 그대로 쓰고, 첫 장(`pose_up`)이 나오면 **사용자에게 화풍을 보여 주고 확인받는다.**
   마음에 안 들면 화풍 문장만 바꿔 다시 시작.
4. 이후 같은 대화에서 "같은 캐릭터, 같은 화풍, 같은 초록(#00FF00) 단색 배경, 글자 없이: ○○" 형식으로 한 장씩 요청한다.
   순서: 1순위(동작 5장) → 2순위(메뉴 16장) → 3순위(물건 31장).
5. 각 그림을 내려받아 `assets/` 에 표의 파일명 그대로 PNG로 저장한다(예: `assets/pose_up.png`).
   제미나이가 JPG를 주면 PNG로 바꾼다: `sips -s format png 입력.jpg --out assets/이름.png`
6. 확인:
   - 배경이 네 귀퉁이까지 고른 단색 초록인지(아니면 게임이 배경을 못 지운다). 아니면 다시 요청.
   - 글자가 들어갔으면 다시 요청.
   - 방향 주의: `ant.png`는 오른쪽을 봄, `bird.png`는 왼쪽을 봄, `plane.png`는 위에서 본 위쪽 향함.
7. 게임에서 보기: 저장소 폴더에서 `python3 -m http.server 8765` 실행 →
   Chrome에서 `http://localhost:8765/?sim` (메뉴) 과 `http://localhost:8765/?sim&bot&skip&game=<놀이id>` 로 각 놀이를 열어
   그림이 이모지 대신 나오고 배경이 투명하게 지워졌는지 본다. 초록 테두리가 남으면 그 그림을 다시 요청.
8. 올리기: `git checkout -b gemini-art && git add assets/*.png && git commit -m "제미나이로 그린 놀이 그림" && git push -u origin gemini-art`
   후 GitHub에서 main으로 PR을 만들고 합친다(사용자는 개발자가 아니다: 용어 없이 "반영했어요"로 보고).

## 지킬 것

- 사용자는 비개발자. 진행 상황은 짧게, 깃·PR 용어 없이.
- 제미나이 하루 생성 한도에 걸리면 거기까지 저장·반영하고, 남은 목록을 사용자에게 알린다.
- 그림 파일 외 코드는 건드리지 않는다(그림은 파일만 넣으면 자동 적용된다).
