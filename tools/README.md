# 배포 파일 만들기

Node.js가 설치된 환경에서 저장소 루트의 `node tools/build.mjs`를 실행하세요. 외부 패키지 설치는 필요 없습니다.

`data/guide.json`, `data/routes.json`, `INTRO.ko.md`, `tools/reader.html`이 원본입니다. 생성된 본문, 장별 Markdown, 출처 목록과 검색 페이지를 함께 커밋합니다.

사용자의 검색·저장·완료 기록은 서버로 보내지 않습니다. 읽기 페이지의 저장 기능은 해당 브라우저의 로컬 저장소를 사용합니다.
