# CHANGELOG

모든 프로젝트의 변경 사항은 이 파일에 기록됩니다. 본 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/) 규격을 따릅니다.

## [v2.5.0] - 2026-02-21
### Security (보안)
- **CDN Subresource Integrity(SRI) 적용**: `marked.js`, `DOMPurify`, `localForage` 3종 CDN 스크립트에 SHA-384 해시(`integrity` 속성) 추가. CDN 침해 시 변조된 스크립트 실행 원천 차단.
- **Phosphor Icons CDN 버전 고정**: `@phosphor-icons/web@2.1.1`로 버전 고정하여 자동 업데이트 방지.
- **innerHTML XSS 벡터 제거**: 확인 모달의 `innerHTML` 대입을 `textContent` + DOM API(`createElement('br')`)로 교체하여 잠재적 XSS 벡터 원천 제거.

### Fixed (수정됨)
- **IndexedDB 저장 실패 시 비상 복구**: `saveToStorage()` 실패 시 자동으로 비상 JSON 백업 파일을 다운로드 유도하여 데이터 유실 방지.
- **FileHandle 직렬화 안전성 강화**: `saveToStorage()` 호출 시 FileHandle 객체를 명시적으로 `null`로 전처리하여 직렬화 정합성 확보.
- **자동/수동 저장 경쟁 조건 해결**: `handleSaveFile()` 시작 시 `clearTimeout(window.saveTimer)` 선행 호출로 동시 I/O 충돌 방지.
- **파일명 특수문자 자동 치환**: 파일 저장 시 OS 금지 특수문자(`\ / : * ? " < > |`)를 자동으로 `_`로 대체하여 `AbortError` 방지.
- **대용량 문서 프리뷰 보호**: 100KB 초과 문서에서 마크다운 프리뷰 자동 비활성화하여 UI 프리징 방지.

## [v2.4.0] - 2026-02-21
### Added (추가됨)
- **[신규] Word Wrap(자동 줄바꿈) 토글 스위치**: 상단 툴바에 iOS/Android 스타일 슬라이딩 토글 스위치를 배치하여, 에디터의 자동 줄바꿈을 실시간으로 ON/OFF 전환 가능. CM6 `Compartment.reconfigure()` 패턴으로 에디터 재생성 없이 즉시 적용. 설정값은 IndexedDB에 저장되어 재실행 시 마지막 상태 유지. 5개국어(한/영/일/중번/중간) 레이블 지원.

## [v2.3.0] - 2026-02-21
### Added (추가됨)
- **[신규] 미니맵(Scroll Miniview) 탑재**: `@replit/codemirror-minimap` 확장을 ESM 동적 로딩(`esm.sh`)으로 통합하여, 에디터 우측에 VS Code 스타일의 축소 코드 미니뷰를 표시. 블록 모드(`displayText: 'blocks'`)로 코드 구조를 추상화하여 표현하며, 반투명 뷰포트 오버레이(`showOverlay: 'always'`)로 현재 보이는 영역을 실시간 표시. 5종 테마 모두에서 배경색과 오버레이 색상이 자동으로 조화되며, 마우스 호버 시 선명도가 향상되는 미세 인터랙션 적용.

## [v2.2.0] - 2026-02-21
### Fixed (수정됨)
- **[핵심] 마크다운 렌더링 줄바꿈 무시 문제 해결**: `marked.js` 전역 옵션에 `breaks: true`를 적용하여, 에디터에서 엔터(단일 줄바꿈)를 입력하면 프리뷰에서도 즉각 `<br>` 태그로 반영되도록 수정. 이전에는 기본값(`breaks: false`)으로 인해 `# 제목` 앞뒤의 줄바꿈이 무시되어 제목이 본문과 합쳐 보이거나, 사용자가 `---`를 입력해야만 크기가 커지는 (Setext 헤딩 혼선) 이상 현상이 발생하였음.
- **[안정성] marked.js CDN 버전 고정**: `https://cdn.jsdelivr.net/npm/marked/marked.min.js` (무한정 최신 자동) → `marked@15.0.6`으로 고정하여, CDN의 자동 업데이트로 인해 예기치 않게 마크다운 파싱 규칙이 바뀌는 사태를 원천 차단.

## [v2.1.0] - 2026-02-21
### Added (추가됨)
- **미저장 탭 닫기 경고 모달**: 내용이 변경(`*` 표시)된 탭을 실수로 닫을 경우, 브라우저가 사용자에게 [저장/저장 안함/닫기 취소] 3가지 옵션을 물어 실수를 방지하는 안전장치 탑재.
- **i18n 브라우저 언어 자동 감지**: 앱 최초 구동 시 `navigator.language`를 파싱하여 글로벌 사용자 환경에 맞게 UI 언어 자동 설정 추가.
- **모바일 반응형(Mobile Responsive) UI**: 좁은 화면(`max-width: 768px`) 접속 시 툴바 스와이프 기능 및 검색 모달 폭 유동적 크기 변경 지원.
- **검색 시각 하이라이트**: CodeMirror `drawSelection` 및 `allowMultipleSelections` 모듈을 도입하여 찾기/바꾸기 시 파란색 블록으로 정밀하게 시각적 표시 추가.

### Fixed (수정됨)
- **[보안]** 마크다운 렌더링 시 XSS (크로스 사이트 스크립팅) 보안 취약점을 방어하기 위해 DOMPurify를 통한 HTML Sanitization 검역 로직 추가.
- **[버그]** 문서 내용이 변경될 때 검색 결과가 무효화되지 않고 과거의 캐시(Stale State) 위치로 잘못 이동하던 인덱싱 불일치 버그 해결.
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
