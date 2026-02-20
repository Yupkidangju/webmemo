# CHANGELOG

모든 프로젝트의 변경 사항은 이 파일에 기록됩니다. 본 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/) 규격을 따릅니다.

## [v2.1.0] - 2026-02-21
### Added (추가됨)
- **i18n 브라우저 언어 자동 감지**: 앱 최초 구동 시 `navigator.language`를 파싱하여 글로벌 사용자 환경에 맞게 UI 언어 자동 설정 추가.
- **모바일 반응형(Mobile Responsive) UI**: 좁은 화면(`max-width: 768px`) 접속 시 툴바 스와이프 기능 및 검색 모달 폭 유동적 크기 변경 지원.
- **검색 시각 하이라이트**: CodeMirror `drawSelection` 및 `allowMultipleSelections` 모듈을 도입하여 찾기/바꾸기 시 파란색 블록으로 정밀하게 시각적 표시 추가.

### Fixed (수정됨)
- 다국어 드롭다운 변경 시 하단 상태표시줄(글자, 단어, 줄, 열)이 즉각 번역되지 않고 커서 이동 후에 갱신되던 디버깅 완료.
- 커스텀 검색창이 열린 상태에서 `Esc` 키를 눌렀을 때 닫히지 않고 에디터로 포커스가 잃어버리던 UX 데드존 해결.

## [v2.0.0] - 2026-02-21
### Changed (변경됨)
- **CodeMirror 6 전면 마이그레이션**: 에디터 코어 엔진을 모바일 환경과 모던 뷰 아키텍처에 적합한 CodeMirror 6로 전면 교체. ES Module(`esm.sh`) 동적 로딩 체계를 역설계하여 번들러 및 로컬 서버 없이 **순수 HTML 더블 클릭만으로 오프라인 네이티브 구동** 유지.
- 지원 구문 강조(Syntax Highlighting) 언어를 CM6 `language-data`가 지원하는 수십 종으로 확장 및 `autoDetectSyntax` 자동 매핑 연동.
- 자체 플로팅 검색창을 CM6 `SearchCursor` 스코프와 신규 통합.

### Fixed (수정됨)
- 백업 복원 시 리스너 다중 바인딩으로 인한 메모리 누수 및 비정상 동작 버그 해결.
- 잘라내기, 복사, 붙여넣기 툴바 버튼을 `navigator.clipboard` 및 CM6 Dispatch API와 직결하여 기능 활성화.
- 닫기 및 새로고침 후에도 `verifyPermission()` 권한 검사를 통해 원본 FileHandle 연결 유지.

## [v1.4.0] - 2026-02-20
### Added (추가)
- 다국어 지원(i18n) 프레임워크 탑재 및 5개국어(한국어, 영어, 일본어, 번체, 간체) 번역 반영. 
- 상단 툴바에 전역 인터페이스 언어 선택 다이얼로그 추가. (IndexedDB 캐싱 연동)
- CodeMirror 기본 검색창을 대체하는 독립형 고급 검색/바꾸기 플로팅 팝업 모달 추가.

## [v1.3.0] - 2026-02-20
### Changed (변경됨)
- **무제한 워크스페이스 저장소 (IndexedDB 마이그레이션)**: 브라우저 기본 `localStorage`의 5MB 용량 한계를 극복하기 위해 `localForage` 라이브러리를 도입하여 수 기가바이트(GB) 단위의 대용량 텍스트 오프라인 영구 저장이 가능해졌습니다.
- 자동 저장 주기(Debouncing)를 최적화하여 초대용량 문서를 편집할 때도 멈춤 현상(Freezing)이 발생하지 않도록 비동기 아키텍처로 개선되었습니다.

## [v1.2.0] - 2026-02-20
### Added (추가됨)
- File System Access API 탑재 (`showOpenFilePicker`, `showSaveFilePicker`)를 통해 네이티브 형태의 파일 열기/저장 창 지원
- **새 이름으로 저장 (Save As)** 버튼 추가 및 Ctrl+Shift+S 단축키 연동 지원
- **자동 언어 인식 엔진 도입 (Auto-Syntax Detection)**: 파일을 열거나 저장할 때 파일 확장자(`.py`, `.js` 등)를 식별하여 CodeMirror의 구문 강조 모드가 알아서 변경되도록 지원
- 탭에 미저장 변경 사항이 있을 때 파일 제목 뒤에 `*` 별표(Modified Indicator)가 표시되는 UI 추가 (저장 시 사라짐)

## [v1.1.0] - 2026-02-20
### Added (추가됨)
- CodeMirror 5 구문 강조(Syntax Highlighting) 및 괄호/들여쓰기 지원 (Python, C, Rust, JS 등 10개 언어 추가)
- 젠 모드 (Zen Mode / 집중 모드) 기능 (F11 단축키 연동)
- 글꼴 확대/축소 (Zoom In/Out) 기능 및 설정 로컬 저장 연동
- 실시간 글자 수 및 단어 수(Characters & Words) 측정 기능
- 마크다운 프리뷰 시 동기화 스크롤(Sync Scroll) 지원
- 전체 탭 상태 및 설정 데이터를 `.json`으로 파일 백업/복원(Workspace Backup & Restore) 기능
- 방금 닫은 탭(최대 20개) 복구(Undo Close Tab) 기능 (Ctrl+Shift+T 연동)
- 전체 텍스트 클립보드 원클릭 복사 체계
- 활성 탭 읽기 전용 모드 잠금 (Read-Only Lock) 기능 지원
- CSS `@media print` 쿼리를 사용한 깔끔한 PDF 인쇄 지원

## [v1.0.0] - 2026-02-20
### Added (추가됨)
- 프로젝트 DNA, 전역 룰셋에 기반한 초기 문서 구조 (README, CHANGELOG, DESIGN_DECISIONS, DESIGN, SPEC 등)
- 시스템 초기 설계 (Architecture Setup)
- 웹 기반 에디터 UI 및 다중 탭 기능
- `localStorage` 기반 상태 저장 기능 (자동 탭 텍스트 복구)
- 파일 내보내기/가져오기 기능
- 마크다운 파싱 렌더링 (`marked.js` 연동)
- 5종(White, Dark, Monokai, Solarized Light, Solarized Dark) 테마 스위칭 기능
