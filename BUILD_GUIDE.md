# 빌드 및 실행 가이드 (BUILD GUIDE)

## 1. 개요
* 본 프로젝트(WebMemo Pro)는 서버나 Node.js 환경 등의 별도 설치가 전혀 필요 없는 순수 정적(Static) 웹 애플리케이션이다.
* 번들러(Webpack, Vite 등) 없이 HTML/JS/CSS 3개 파일만으로 구성됨.
* 현재 버전: **v3.0.0**

## 2. 실행 방법
1. 프로젝트 루트에 있는 `index.html` 파일을 더블클릭하여 웹 브라우저(Chrome, Edge 권장)로 실행한다.
2. CodeMirror 6, marked.js, DOMPurify, localForage, Mermaid.js, KaTeX 등 모든 외부 의존성은 CDN(esm.sh, unpkg, cdnjs, jsdelivr)에서 자동 로드된다.
3. 인터넷 연결이 필요한 것은 **최초 로드 시 CDN 모듈 다운로드**뿐이며, 브라우저 캐시 후에는 오프라인 사용 가능.

## 3. 대안 실행 방법 (CORS 이슈 시)
* VSCode `Live Server` 확장 사용
* Python 로컬 서버: `python -m http.server 8080`
* Node.js: `npx serve .`

## 4. 파일 구조
```
WebMemo/
├── index.html          # 메인 HTML (단일 페이지)
├── app.js              # 앱 로직 전체 (~2,015줄)
├── styles.css          # 스타일시트 (~860줄)
├── sri_hash.ps1        # SRI 해시 생성 스크립트
├── README.md           # 다국어 소개 (한/영/일/중번/중간)
├── CHANGELOG.md        # 변경 이력 (SemVer)
├── BUILD_GUIDE.md      # 이 파일
└── [로컬 전용 문서]
    ├── designs.md
    ├── spec.md
    ├── DESIGN_DECISIONS.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── LESSONS_LEARNED.md
    └── audit_roadmap.md
```

## 5. 외부 CDN 의존성
| 패키지 | 용도 | 로딩 방식 |
|---|---|---|
| @codemirror/* | 에디터 엔진 | esm.sh 동적 import |
| @replit/codemirror-minimap | 미니맵 | esm.sh 동적 import |
| @replit/codemirror-vim | Vim 모드 | esm.sh 동적 import |
| marked.js v15.0.6 | 마크다운 | CDN (SRI 고정) |
| DOMPurify v3.2.4 | XSS 방어 | CDN (SRI 고정) |
| localForage v1.10.0 | IndexedDB | CDN (SRI 고정) |
| Phosphor Icons v2.1.1 | UI 아이콘 | unpkg CDN |
| Mermaid.js v11.12.3 | 다이어그램 렌더링 | jsdelivr CDN (defer) |
| KaTeX v0.16.28 | 수학 공식 렌더링 | jsdelivr CDN (defer) |
| Inter + JetBrains Mono | 폰트 | Google Fonts |
