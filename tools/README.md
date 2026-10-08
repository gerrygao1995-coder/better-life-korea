# 배포 파일 만들기

Node.js가 설치된 환경에서 저장소 루트의 `node tools/build.mjs`를 실행하세요. 외부 패키지 설치는 필요 없습니다.

`data/guide.json`, `data/routes.json`, `INTRO.ko.md`, `tools/reader.html`이 원본입니다. 생성된 본문, 장별 Markdown, 출처 목록과 검색 페이지를 함께 커밋합니다.

사용자의 검색·저장·완료 기록은 서버로 보내지 않습니다. 읽기 페이지의 저장 기능은 해당 브라우저의 로컬 저장소를 사용합니다.


## 웹 출처와 전세 체크리스트

`node tools/build.mjs`는 `build-sources.mjs`와 `build-jeonse.mjs`도 실행해 `sources.html`, `jeonse.html`, `JEONSE.ko.md`를 갱신합니다. 전세 원본은 `data/jeonse.json`입니다.

공유 이미지는 별도 선택 작업입니다. `sharp`를 설치한 환경에서 `node tools/build-social.mjs`를 실행하면 네 장의 PNG와 미리보기 PNG를 만듭니다. 본문이 바뀌면 이미지 요약의 조건도 함께 확인하세요.
