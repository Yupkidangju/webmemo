# WebMemo Pro
[🇰🇷 한국어](#한국어) | [🇺🇸 English](#english) | [🇯🇵 日本語](#日本語) | [🇹🇼 繁體中文](#繁體中文) | [🇨🇳 简体中文](#简体中文)
---
## 🇰🇷 한국어
웹 브라우저에서 서버 없이 완벽하게 구동되는 로컬 네이티브 노트패드 애플리케이션입니다.

### 기능 (Features)
- **무설치 로컬 환경**: 순수 HTML/JS/CSS로 구현. `index.html` 더블 클릭만으로 `file://` 및 `http://` 환경 모두에서 즉시 오프라인 구동.
- **네이티브 파일 시스템 연동**: File System Access API로 `Ctrl+S` 덮어쓰기 저장. 차단 시 Blob 다운로드 자동 Fallback.
- **자동 구문 강조 (Auto-Syntax)**: **CodeMirror 6** 엔진 탑재. ESM 동적 로딩으로 100+종 언어 자동 인식.
- **무제한 백그라운드 저장**: IndexedDB(localForage) 기반으로 5MB 제약 돌파. 기가바이트 단위 문서도 안전 보존.
- **⌨️ Vim 모드**: `@replit/codemirror-vim` 탑재. Normal/Insert/Visual 모드, `:w`(저장), `:wq`(저장+닫기). 기본 OFF, 토글 ON.
- **파일 드래그&드롭**: 탐색기에서 텍스트 파일을 브라우저에 직접 끌어다 놓으면 새 탭으로 즉시 오픈.
- **마크다운 Floating TOC**: 마크다운 모드에서 h1~h6 헤딩 기반 목차를 우측에 자동 생성. 클릭 시 해당 위치로 이동.
- **로컬 타임머신**: 저장 시 탭별 최근 10개 리비전을 자동 스냅샷. IndexedDB에 보관.
- **고급 에디터 UX**: 다중 탭(드래그 순서 변경), 5종 커스텀 테마, 미니맵, 젠 모드, 닫은 탭 복구, 플로팅 검색, Word Wrap 토글.
- **5개국어 i18n**: 한국어, English, 日本語, 繁體中文, 简体中文 UI 완벽 지원.
- **보안 강화**: SRI 해시 고정, DOMPurify XSS 방어, DOM-XSS 방지. AI 크로스 감사 6라운드 통과.

---
## 🇺🇸 English
A pure local notepad application perfectly operating in a web browser without a server.

### Features
- **Zero-Install Local Environment**: Built with pure HTML/JS/CSS. Just double-click `index.html` to run completely offline.
- **Native File System Access**: Uses Web APIs to `Ctrl+S` save directly to local files. Graceful Blob download fallback.
- **Auto-Syntax Highlighting**: **CodeMirror 6** powered. Dynamically loads and detects 100+ languages via ESM imports.
- **Unlimited Storage**: IndexedDB / localForage powered. Breaks the 5MB limit for safe persistent background saves.
- **⌨️ Vim Mode**: `@replit/codemirror-vim` integration. Normal/Insert/Visual modes, `:w` (save), `:wq` (save & close). Off by default.
- **File Drag & Drop**: Drag text files from your file explorer directly into the browser to instantly open in new tabs.
- **Markdown Floating TOC**: Auto-generated table of contents from h1~h6 headings. Click to navigate.
- **Local Time Machine**: Auto-snapshots of last 10 revisions per tab on save. Stored in IndexedDB.
- **Advanced UX**: Multi-tab with drag reorder, 5 themes, minimap, Zen mode, tab recovery, custom search, Word Wrap toggle.
- **5-Language i18n**: Korean, English, Japanese, Traditional Chinese, Simplified Chinese UI.
- **Security Hardened**: SRI hash pinning, DOMPurify XSS defense. 6-round AI cross-audit passed.

---
## 🇯🇵 日本語
サーバーなしでウェブブラウザ上で完璧に動作するローカルメモ帳アプリケーションです。

### 特徴 (Features)
- **インストール不要**: HTML/JS/CSSのみ。`index.html`をダブルクリックするだけでオフライン完全動作。
- **ネイティブファイル操作**: File System Access APIで`Ctrl+S`ローカル上書き保存。HTTP環境でも自動Fallback。
- **自動構文ハイライト**: **CodeMirror 6** エンジン搭載。ESM動的ロードで100+言語を自動認識。
- **無制限ストレージ**: IndexedDB技術により5MB制限を突破。
- **⌨️ Vimモード**: `@replit/codemirror-vim`統合。`:w`で保存、`:wq`で保存して閉じる。デフォルトOFF。
- **ファイルドラッグ&ドロップ**: エクスプローラーからテキストファイルを直接ドロップして新タブで開く。
- **マークダウンFloating TOC**: h1~h6見出しから目次を自動生成。クリックでジャンプ。
- **ローカルタイムマシン**: 保存時にタブごとに最新10件のスナップショットを自動保存。
- **高度なUX**: マルチタブ(ドラッグ並べ替え)、5テーマ、ミニマップ、禅モード、タブ復元、検索。

---
## 🇹🇼 繁體中文
不需伺服器，可在網頁瀏覽器中完美運作的本機記事本應用程式。

### 功能特色 (Features)
- **無須安裝**: 純 HTML/JS/CSS。雙擊 `index.html` 即可完全離線運行。
- **原生文件系統**: File System Access API 支援 `Ctrl+S` 本地覆蓋儲存。HTTP 環境自動回退。
- **語法高亮**: 內建 **CodeMirror 6**，ESM 動態載入 100+ 語言自動識別。
- **無限制儲存**: IndexedDB 打破 5MB 限制。
- **⌨️ Vim 模式**: `@replit/codemirror-vim` 整合。`:w` 儲存、`:wq` 儲存並關閉。預設關閉。
- **檔案拖放**: 從檔案總管直接拖放文字檔案到瀏覽器開啟新分頁。
- **Markdown 浮動目錄**: 從 h1~h6 標題自動生成目錄樹。點擊跳轉。
- **本地時光機**: 儲存時自動保留每個分頁最近 10 個快照。
- **進階 UX**: 多分頁拖放排序、5 主題、小地圖、禪模式、分頁復原、搜尋替換。

---
## 🇨🇳 简体中文
无需服务器即可在 Web 浏览器中直接运行的纯本地记事本应用程序。

### 功能 (Features)
- **免安装本地环境**: 纯 HTML/JS/CSS。双击 `index.html` 完全离线运行。
- **原生文件系统**: File System Access API 支持 `Ctrl+S` 本地覆盖保存。HTTP 环境自动回退。
- **自动语法高亮**: 搭载 **CodeMirror 6**，ESM 动态加载自动识别 100+ 种语言。
- **无限制存储**: 采用 IndexedDB 完全解除 5MB 限制。
- **⌨️ Vim 模式**: `@replit/codemirror-vim` 集成。`:w` 保存、`:wq` 保存并关闭。默认关闭。
- **文件拖放**: 从文件管理器直接拖放文本文件到浏览器打开新标签。
- **Markdown 浮动目录**: 从 h1~h6 标题自动生成目录树。点击跳转。
- **本地时光机**: 保存时自动保留每个标签最近 10 个快照。
- **高级 UX**: 多标签拖放排序、5 主题、迷你地图、禅模式、标签恢复、搜索替换。
