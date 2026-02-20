# WebMemo Pro
[🇰🇷 한국어](#한국어) | [🇺🇸 English](#english) | [🇯🇵 日本語](#日本語) | [🇹🇼 繁體中文](#繁體中文) | [🇨🇳 简体中文](#简体中文)
---
## 🇰🇷 한국어
웹 브라우저에서 서버 없이 완벽하게 구동되는 로컬 네이티브 노트패드 애플리케이션입니다.

### 기능 (Features)
- **무설치 로컬 환경**: 순수 HTML/JS/CSS로 구현되어 별도 서버나 번들러 없이 1초만에 `file://` 이나 `http://` 환경 모두에서 오프라인 로드 완료. (Fallback 지원)
- **네이티브 파일 시스템 연동**: 크롬의 File System Access API를 채택하여 윈도우 메모장과 똑같이 단축키(`Ctrl+S`, `Ctrl+O`)로 로컬 경로에 쓰며, 권한 차단 시 자체 다운로드로 우회합니다.
- **자동 구문 강조 (Auto-Syntax)**: 모던 **CodeMirror 6** 엔진을 탑재하였으며, ESM 동적 로딩을 통해 파일 확장자(`*.js`, `*.py`, `*.md` 등)를 인식해 수십 종 언어의 문법 색상을 즉각 반영합니다.
- **무제한 백그라운드 저장**: IndexedDB(localForage) 기반으로 5MB 제약을 돌파, 기가바이트 단위의 멀티 탭 문서도 브라우저에 비동기로 안전하게 영구 보존됩니다.
- **고급 에디터 UX**: 다중 탭, 5종 커스텀 테마, 마크다운 실시간 렌더링, 젠 모드(전체화면), 닫은 탭 복구 플로팅 검색창 등을 모두 완벽 지원합니다.

---
## 🇺🇸 English
A pure local notepad application perfectly operating in a web browser without a server.

### Features
- **Zero-Install Local Environment**: Built without node-modules. Just double click `index.html` to run completely offline.
- **Native File System Access**: Uses Web APIs to access and save local files with `Ctrl+S` exactly like a desktop app. Falls back gracefully on HTTP.
- **Auto-Syntax Highlighting**: **CodeMirror 6** powered. Detects your file extension dynamically securely and matches the syntax theme (Supports 100+ languages).
- **Unlimited DB Storage**: Powered by IndexedDB / localForage. Safe background continuous saves breaking the 5MB browser limits. 
- **Advanced UX**: Multi-tab browsing, 5 unique themes, Zen-Mode, Realtime Markdown rendering, Custom Search and Tab-Recovery.

---
## 🇯🇵 日本語
サーバーなしでウェブブラウザ上で完璧に動作するローカルメモ帳アプリケーションです。

### 特徴 (Features)
- **インストール不要のローカル環境**: HTML/JS/CSSだけで実装。サーバーなしで`file://`プロトコルからオフラインで完璧に動作します。
- **Native File System API**: ブラウザからPCのローカルファイルへ直接アクセス、上書き保存(`Ctrl+S`)が可能。
- **自動構文ハイライト(Auto-Syntax)**: **CodeMirror 6** エンジン搭載。拡張子から100以上の言語を自動識別してハイライトします。
- **無制限ストレージ**: IndexedDB技術により、5MBの限界を超え、数GBのテキストも安全に非同期保存します。

---
## 🇹🇼 繁體中文
不需伺服器，可在網頁瀏覽器中完美運作的本機記事本應用程式。

### 功能特色 (Features)
- **無須安裝的本機環境**: 純 HTML/JS/CSS 實作。無需伺服器，直接打開 `index.html` 即可離線完美運行。
- **原生文件系統API**: 媲美桌面應用程式，直接讀取和本地存檔 (`Ctrl+S`)，並支援 HTTP 回退模式。
- **語法高亮 (Auto-Syntax)**: 內建 **CodeMirror 6**，可根據副檔名動態載入並自動辨識 100+ 語言與上色。
- **無限制資料庫存檔**: 採用 IndexedDB 打破 5MB 限制，離線存檔安全又快速。

---
## 🇨🇳 简体中文
无需服务器即可在 Web 浏览器中直接运行的纯本地记事本应用程序。

### 功能 (Features)
- **免安装本地环境**: 纯 HTML/JS/CSS 实现，随时点开即用。无需服务器即可在 `file://` 协议下离线完美运行。
- **原生文件系统操作**: 像桌面软件一样直接 `Ctrl+S` 把文件原位保存，并支持 HTTP 回退模式。
- **自动语法高亮 (Auto-Syntax)**: 搭载 **CodeMirror 6** 编辑器并根据文件后缀动态加载并自动选择 100+ 种代码高亮模式。
- **无限制持久化存储**: 采用 IndexedDB 完全解除浏览器 5MB 存储上限，后台静默自动保存大文件。
