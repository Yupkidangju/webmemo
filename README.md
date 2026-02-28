# WebMemo Pro
[🇰🇷 한국어](#한국어) | [🇺🇸 English](#english) | [🇯🇵 日本語](#日本語) | [🇹🇼 繁體中文](#繁體中文) | [🇨🇳 简体中文](#简体中文)
---
## 🇰🇷 한국어
웹 브라우저에서 서버 없이 완벽하게 구동되는 로컬 네이티브 노트패드 애플리케이션입니다.

### 기능 (Features)
- **무설치 로컬 환경**: 순수 HTML/JS/CSS 3파일로 구현. `index.html` 더블 클릭만으로 `file://` 및 `http://` 환경 모두에서 즉시 오프라인 구동.
- **📱 모바일 완벽 지원**: 스마트폰·태블릿 브라우저에서 데스크톱과 동일한 에디터 기능. 터치 최적화 UX, 모바일 저장 지원.
- **네이티브 파일 시스템 연동**: File System Access API로 `Ctrl+S` / `Cmd+S` 덮어쓰기 저장. 차단 시 Blob 다운로드 자동 Fallback.
- **자동 구문 강조 (Auto-Syntax)**: **CodeMirror 6** 엔진 탑재. ESM 동적 로딩으로 100+종 언어 자동 인식.
- **무제한 백그라운드 저장**: IndexedDB(localForage) 기반으로 5MB 제약 돌파. 기가바이트 단위 문서도 안전 보존.
- **⌨️ Vim 모드**: `@replit/codemirror-vim` 탑재. Normal/Insert/Visual 모드, `:w`(저장), `:wq`(저장+닫기). **한글 키맵 지원** — 한글 입력 상태에서도 Vim 명령어 자동 인식.
- **📊 Mermaid 다이어그램**: flowchart, sequence, gantt, pie, mindmap, quadrantChart 등 **13종+** 다이어그램을 마크다운 내 실시간 렌더링.
- **📐 KaTeX 수학 수식**: 인라인(`$E=mc^2$`) 및 블록(`$$...$$`) 수학 공식 렌더링.
- **마크다운 Floating TOC**: 마크다운 모드에서 h1~h6 헤딩 기반 목차를 우측에 자동 생성. 클릭 시 에디터+프리뷰 동시 이동.
- **파일 드래그&드롭**: 탐색기에서 텍스트 파일을 브라우저에 직접 끌어다 놓으면 새 탭으로 즉시 오픈.
- **로컬 타임머신**: 저장 시 탭별 최근 10개 리비전을 자동 스냅샷. IndexedDB에 보관.
- **고급 에디터 UX**: 다중 탭(드래그 순서 변경), 6종 커스텀 테마, 미니맵, 젠 모드(F11), 닫은 탭 복구, 플로팅 검색/치환, Word Wrap 토글, 인쇄(Ctrl+P).
- **🖥️ 크로스 플랫폼**: Windows(Ctrl), Mac(Cmd), Linux — 모든 단축키가 플랫폼별로 자동 대응.
- **5개국어 i18n**: 한국어, English, 日本語, 繁體中文, 简体中文 UI 완벽 지원.
- **🔒 이중 살균 보안**: SRI 해시 고정, DOMPurify 이중 살균 파이프라인(HTML+SVG), DOM-XSS 방지, 비동기 렌더링 레이스 컨디션 방어. AI 크로스 감사 6라운드 통과.

### 문제 해결 (Troubleshooting)
- **드래그 앤 드롭으로 닷파일(.cursor, .gitignore 등)이 열리지 않는 문제**: v3.0.1부터 확장자 없는 파일 및 닷파일도 정상적으로 인식되어 텍스트 에디터로 열립니다. 다중 파일 드롭 시 발생하던 과도한 렌더링 부하도 해소되었습니다.

---
## 🇺🇸 English
A pure local notepad application perfectly operating in a web browser without a server.

### Features
- **Zero-Install Local Environment**: Built with just 3 files (HTML/JS/CSS). Just double-click `index.html` to run completely offline.
- **📱 Full Mobile Support**: Identical editor functionality on smartphones and tablets. Touch-optimized UX with mobile save support.
- **Native File System Access**: Uses Web APIs for `Ctrl+S` / `Cmd+S` direct save-to-file. Graceful Blob download fallback.
- **Auto-Syntax Highlighting**: **CodeMirror 6** powered. Dynamically loads and detects 100+ languages via ESM imports.
- **Unlimited Storage**: IndexedDB / localForage powered. Breaks the 5MB limit for safe persistent background saves.
- **⌨️ Vim Mode**: `@replit/codemirror-vim` integration. Normal/Insert/Visual modes, `:w` (save), `:wq` (save & close). **Korean IME keymap** — Vim commands work even in Korean input mode.
- **📊 Mermaid Diagrams**: Flowcharts, sequence, gantt, pie, mindmap, quadrantChart — **13+ diagram types** rendered live inside Markdown.
- **📐 KaTeX Math**: Inline (`$E=mc^2$`) and block (`$$...$$`) math formula rendering.
- **Markdown Floating TOC**: Auto-generated table of contents from h1~h6 headings. Click to sync-scroll editor + preview.
- **File Drag & Drop**: Drag text files from your file explorer directly into the browser to instantly open in new tabs.
- **Local Time Machine**: Auto-snapshots of last 10 revisions per tab on save. Stored in IndexedDB.
- **Advanced UX**: Multi-tab with drag reorder, 6 themes, minimap, Zen mode (F11), tab recovery, custom search/replace, Word Wrap toggle, Print (Ctrl+P).
- **🖥️ Cross-Platform**: Windows (Ctrl), Mac (Cmd), Linux — all shortcuts auto-adapt per platform.
- **5-Language i18n**: Korean, English, Japanese, Traditional Chinese, Simplified Chinese UI.
- **🔒 Double-Sanitize Security**: SRI hash pinning, DOMPurify double sanitization pipeline (HTML+SVG), DOM-XSS prevention, async render race condition defense. 6-round AI cross-audit passed.

### Troubleshooting
- **Drag & Drop for Dotfiles (e.g., .cursor)**: Starting from v3.0.1, dotfiles and extensionless files are natively recognized and opened as text. Heavy duplicate rendering performance issues on dropping multiple files have also been resolved.

---
## 🇯🇵 日本語
サーバーなしでウェブブラウザ上で完璧に動作するローカルメモ帳アプリケーションです。

### 特徴 (Features)
- **インストール不要**: HTML/JS/CSS 3ファイルのみ。`index.html`をダブルクリックするだけでオフライン完全動作。
- **📱 モバイル完全対応**: スマートフォン・タブレットのブラウザでデスクトップと同等のエディタ機能。タッチ最適化UX。
- **ネイティブファイル操作**: File System Access APIで`Ctrl+S`/`Cmd+S`ローカル上書き保存。HTTP環境でも自動Fallback。
- **自動構文ハイライト**: **CodeMirror 6** エンジン搭載。ESM動的ロードで100+言語を自動認識。
- **無制限ストレージ**: IndexedDB技術により5MB制限を突破。
- **⌨️ Vimモード**: `@replit/codemirror-vim`統合。`:w`で保存、`:wq`で保存して閉じる。**韓国語IMEキーマップ**対応。
- **📊 Mermaidダイアグラム**: フローチャート、シーケンス図、ガントチャートなど**13種以上**をマークダウン内でリアルタイムレンダリング。
- **📐 KaTeX数式**: インライン(`$E=mc^2$`)およびブロック(`$$...$$`)数式レンダリング。
- **マークダウンFloating TOC**: h1~h6見出しから目次を自動生成。クリックでエディタ＋プレビュー同時ジャンプ。
- **ファイルドラッグ&ドロップ**: エクスプローラーからテキストファイルを直接ドロップして新タブで開く。
- **ローカルタイムマシン**: 保存時にタブごとに最新10件のスナップショットを自動保存。
- **高度なUX**: マルチタブ(ドラッグ並べ替え)、6テーマ、ミニマップ、禅モード(F11)、タブ復元、検索/置換、印刷(Ctrl+P)。
- **🖥️ クロスプラットフォーム**: Windows(Ctrl)、Mac(Cmd)、Linux対応。
- **5言語i18n**: 韓国語、英語、日本語、繁体字中国語、簡体字中国語UI完全対応。
- **🔒 二重サニタイズセキュリティ**: SRIハッシュ固定、DOMPurify二重消毒、DOM-XSS防止。AI 6ラウンド監査済。

### トラブルシューティング (Troubleshooting)
- **ドットファイル(.cursor等)のドラッグ＆ドロップ**: v3.0.1から、拡張子のないファイルやドットファイルも正常にテキストとして認識され開かれます。複数ファイルドロップ時の重複レンダリング負荷も解消されました。

---
## 🇹🇼 繁體中文
不需伺服器，可在網頁瀏覽器中完美運作的本機記事本應用程式。

### 功能特色 (Features)
- **無須安裝**: 純 HTML/JS/CSS 3個檔案。雙擊 `index.html` 即可完全離線運行。
- **📱 完整行動裝置支援**: 智慧型手機與平板電腦瀏覽器享有與桌面版相同的編輯功能。觸控最佳化 UX。
- **原生文件系統**: File System Access API 支援 `Ctrl+S`/`Cmd+S` 本地覆蓋儲存。HTTP 環境自動回退。
- **語法高亮**: 內建 **CodeMirror 6**，ESM 動態載入 100+ 語言自動識別。
- **無限制儲存**: IndexedDB 打破 5MB 限制。
- **⌨️ Vim 模式**: `@replit/codemirror-vim` 整合。`:w` 儲存、`:wq` 儲存並關閉。**韓文 IME 鍵位映射**支援。
- **📊 Mermaid 圖表**: 流程圖、序列圖、甘特圖等**13種以上**圖表在 Markdown 中即時渲染。
- **📐 KaTeX 數學公式**: 行內(`$E=mc^2$`)及區塊(`$$...$$`)數學公式渲染。
- **Markdown 浮動目錄**: 從 h1~h6 標題自動生成目錄樹。點擊同時跳轉編輯器與預覽。
- **檔案拖放**: 從檔案總管直接拖放文字檔案到瀏覽器開啟新分頁。
- **本地時光機**: 儲存時自動保留每個分頁最近 10 個快照。
- **進階 UX**: 多分頁拖放排序、6 主題、小地圖、禪模式(F11)、分頁復原、搜尋替換、列印(Ctrl+P)。
- **🖥️ 跨平台**: Windows(Ctrl)、Mac(Cmd)、Linux 快捷鍵自動適配。
- **5 語言 i18n**: 韓文、英文、日文、繁體中文、簡體中文 UI 完整支援。
- **🔒 雙重消毒安全**: SRI 雜湊固定、DOMPurify 雙重消毒管線、DOM-XSS 防禦。AI 6 輪交叉審計通過。

### 疑難排解 (Troubleshooting)
- **拖放點檔案（如 .cursor）**: 從 v3.0.1 開始，無副檔名及點檔案皆可正常識別為純文字開啟。同時也解決了多檔案拖放時重複渲染的效能問題。

---
## 🇨🇳 简体中文
无需服务器即可在 Web 浏览器中直接运行的纯本地记事本应用程序。

### 功能 (Features)
- **免安装本地环境**: 纯 HTML/JS/CSS 3个文件。双击 `index.html` 完全离线运行。
- **📱 完整移动端支持**: 智能手机和平板浏览器享有与桌面版相同的编辑器功能。触控优化 UX。
- **原生文件系统**: File System Access API 支持 `Ctrl+S`/`Cmd+S` 本地覆盖保存。HTTP 环境自动回退。
- **自动语法高亮**: 搭载 **CodeMirror 6**，ESM 动态加载自动识别 100+ 种语言。
- **无限制存储**: 采用 IndexedDB 完全解除 5MB 限制。
- **⌨️ Vim 模式**: `@replit/codemirror-vim` 集成。`:w` 保存、`:wq` 保存并关闭。**韩语 IME 键位映射**支持。
- **📊 Mermaid 图表**: 流程图、序列图、甘特图等**13种以上**图表在 Markdown 中实时渲染。
- **📐 KaTeX 数学公式**: 行内(`$E=mc^2$`)和块级(`$$...$$`)数学公式渲染。
- **Markdown 浮动目录**: 从 h1~h6 标题自动生成目录树。点击同步跳转编辑器与预览。
- **文件拖放**: 从文件管理器直接拖放文本文件到浏览器打开新标签。
- **本地时光机**: 保存时自动保留每个标签最近 10 个快照。
- **高级 UX**: 多标签拖放排序、6 主题、迷你地图、禅模式(F11)、标签恢复、搜索替换、打印(Ctrl+P)。
- **🖥️ 跨平台**: Windows(Ctrl)、Mac(Cmd)、Linux 快捷键自动适配。
- **5 语言 i18n**: 韩语、英语、日语、繁体中文、简体中文 UI 完整支持。
- **🔒 双重消毒安全**: SRI 哈希固定、DOMPurify 双重消毒管线、DOM-XSS 防御。AI 6 轮交叉审计通过。

### 疑难解答 (Troubleshooting)
- **拖放点文件（如 .cursor）**: 从 v3.0.1 开始，无扩展名文件及点文件均可正常识别为纯文本打开。同时也解决了多文件拖放时重复渲染的性能问题。
