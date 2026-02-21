// Global CodeMirror 6 Dependencies
let EditorState, Compartment, StateEffect, EditorSelection;
let EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection;
let defaultKeymap, history, historyKeymap, indentWithTab, undo, redo;
let languages;
let SearchCursor;
let syntaxHighlighting, defaultHighlightStyle, bracketMatching;
let closeBrackets;
// [v2.3.0] 미니맵 (스크롤 미니뷰) 확장 의존성
let showMinimap;

let languageConf;
let readOnlyConf;
let themeConf;
let fontConf;
// [v2.4.0] Word Wrap(자동 줄바꿈) 동적 토글용 Compartment
let wrapConf;

async function loadCM6() {
    const state = await import("https://esm.sh/@codemirror/state");
    EditorState = state.EditorState; Compartment = state.Compartment; StateEffect = state.StateEffect; EditorSelection = state.EditorSelection;

    const view = await import("https://esm.sh/@codemirror/view");
    EditorView = view.EditorView; keymap = view.keymap; lineNumbers = view.lineNumbers; highlightActiveLineGutter = view.highlightActiveLineGutter; drawSelection = view.drawSelection;

    const cmds = await import("https://esm.sh/@codemirror/commands");
    defaultKeymap = cmds.defaultKeymap; history = cmds.history; historyKeymap = cmds.historyKeymap; indentWithTab = cmds.indentWithTab; undo = cmds.undo; redo = cmds.redo;

    const langData = await import("https://esm.sh/@codemirror/language-data");
    languages = langData.languages;

    const search = await import("https://esm.sh/@codemirror/search");
    SearchCursor = search.SearchCursor;

    const lang = await import("https://esm.sh/@codemirror/language");
    syntaxHighlighting = lang.syntaxHighlighting; defaultHighlightStyle = lang.defaultHighlightStyle; bracketMatching = lang.bracketMatching;

    const ac = await import("https://esm.sh/@codemirror/autocomplete");
    closeBrackets = ac.closeBrackets;

    // [v2.3.0] Replit 제작 CodeMirror 6 미니맵 확장 동적 로딩
    // VS Code 스타일의 우측 축소 코드 미니뷰 + 반투명 뷰포트 오버레이 제공
    const minimap = await import("https://esm.sh/@replit/codemirror-minimap");
    showMinimap = minimap.showMinimap;

    languageConf = new Compartment();
    readOnlyConf = new Compartment();
    themeConf = new Compartment();
    fontConf = new Compartment();
    // [v2.4.0] Word Wrap Compartment: 런타임에 EditorView.lineWrapping을 동적 on/off
    wrapConf = new Compartment();
}

// ==========================================
// WebMemo Pro Logic - App.js (Phase 2)
// ==========================================

const STORAGE_KEY = 'webmemo_data';

function detectInitialLanguage() {
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('ko')) return 'ko';
    if (navLang.startsWith('ja')) return 'ja';
    if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-hk')) return 'zh-TW';
    if (navLang.startsWith('zh')) return 'zh-CN';
    return 'en'; // Fallback
}

// Default Data Structure
let appData = {
    tabs: [
        { id: 'tab_' + Date.now(), title: '무제 1', content: '', lang: 'text/plain', readonly: false, handle: null }
    ],
    activeTabId: null,
    theme: 'white',
    markdownMode: false,
    fontSize: 14,
    uiLang: detectInitialLanguage(), // Auto-detect UI Language
    wordWrap: false // [v2.4.0] Word Wrap 상태 (기본: OFF, 코딩 시 줄바꿈 없음)
};

// ==========================================
// i18n Dictionary (5 Languages)
// ==========================================
const i18nDict = {
    'ko': {
        'btn-new': '새 파일 (Ctrl+N)',
        'btn-open': '파일 열기 (Ctrl+O)',
        'btn-save': '파일 저장 (Ctrl+S)',
        'btn-save-as': '다른 이름으로 저장 (Ctrl+Shift+S)',
        'btn-backup': '작업 공간 전체 백업 (.json)',
        'btn-restore': '작업 공간 복원',
        'btn-print': 'PDF 인쇄 (Ctrl+P)',
        'btn-undo': '실행 취소 (Ctrl+Z)',
        'btn-redo': '다시 실행 (Ctrl+Y)',
        'btn-search': '검색/찾아 바꾸기 (Ctrl+F)',
        'btn-cut': '잘라내기 (Ctrl+X)',
        'btn-copy': '복사 (Ctrl+C)',
        'btn-paste': '붙여넣기 (Ctrl+V)',
        'btn-copy-all': '전체 텍스트 복사',
        'btn-readonly': '읽기 전용 잠금',
        'btn-zoom-out': '글꼴 축소 (Ctrl+-)',
        'btn-zoom-in': '글꼴 확대 (Ctrl++)',
        'btn-zen': '젠 모드 (전체화면) (F11)',
        'btn-markdown': '마크다운 모드 전환 (Ctrl+M)',
        'btn-add-tab': '새 탭',
        'btn-undo-tab': '방금 닫은 탭 복구 (Ctrl+Shift+T)',
        'ui-lang-select': '인터페이스 언어',
        'lang-select': '언어 구문 강조',
        'theme-select': '테마 변경',
        'status-ready': '준비됨',
        'status-saving': '저장중...',
        'status-saved': '저장됨',
        'status-error': '오류 발생',
        'search-title': '찾기 / 바꾸기',
        'search-placeholder': '검색어 입력...',
        'replace-placeholder': '바꿀 내용...',
        'btn-replace': '바꾸기',
        'btn-replace-all': '모두 바꾸기',
        'stats-char': '글자',
        'stats-word': '단어',
        'stats-line': '줄',
        'stats-col': '열',
        'confirm-msg': '저장하지 않은 변경사항이 있습니다.<br>저장하시겠습니까?',
        'btn-confirm-save': '저장',
        'btn-confirm-discard': '저장 안함',
        'btn-confirm-cancel': '닫기 취소',
        'label-wordwrap': '줄바꿈'
    },
    'en': {
        'btn-new': 'New File (Ctrl+N)',
        'btn-open': 'Open File (Ctrl+O)',
        'btn-save': 'Save (Ctrl+S)',
        'btn-save-as': 'Save As (Ctrl+Shift+S)',
        'btn-backup': 'Backup Workspace (.json)',
        'btn-restore': 'Restore Workspace',
        'btn-print': 'Print to PDF (Ctrl+P)',
        'btn-undo': 'Undo (Ctrl+Z)',
        'btn-redo': 'Redo (Ctrl+Y)',
        'btn-search': 'Find / Replace (Ctrl+F)',
        'btn-cut': 'Cut (Ctrl+X)',
        'btn-copy': 'Copy (Ctrl+C)',
        'btn-paste': 'Paste (Ctrl+V)',
        'btn-copy-all': 'Copy All Text',
        'btn-readonly': 'Toggle Read-Only',
        'btn-zoom-out': 'Zoom Out (Ctrl+-)',
        'btn-zoom-in': 'Zoom In (Ctrl++)',
        'btn-zen': 'Zen Mode (Fullscreen) (F11)',
        'btn-markdown': 'Toggle Markdown (Ctrl+M)',
        'btn-add-tab': 'New Tab',
        'btn-undo-tab': 'Restore Closed Tab (Ctrl+Shift+T)',
        'ui-lang-select': 'UI Language',
        'lang-select': 'Syntax Highlighting',
        'theme-select': 'Change Theme',
        'status-ready': 'Ready',
        'status-saving': 'Saving...',
        'status-saved': 'Saved',
        'status-error': 'Error Occurred',
        'search-title': 'Find & Replace',
        'search-placeholder': 'Find...',
        'replace-placeholder': 'Replace with...',
        'btn-replace': 'Replace',
        'btn-replace-all': 'Replace All',
        'stats-char': 'Char',
        'stats-word': 'Word',
        'stats-line': 'Ln',
        'stats-col': 'Col',
        'confirm-msg': 'You have unsaved changes.<br>Do you want to save?',
        'btn-confirm-save': 'Save',
        'btn-confirm-discard': 'Discard',
        'btn-confirm-cancel': 'Cancel',
        'label-wordwrap': 'Wrap'
    },
    'ja': {
        'btn-new': '新規ファイル (Ctrl+N)',
        'btn-open': 'ファイルを開く (Ctrl+O)',
        'btn-save': '保存 (Ctrl+S)',
        'btn-save-as': '名前を付けて保存 (Ctrl+Shift+S)',
        'btn-backup': 'ワークスペースのバックアップ',
        'btn-restore': 'ワークスペースの復元',
        'btn-print': 'PDF 印刷 (Ctrl+P)',
        'btn-undo': '元に戻す (Ctrl+Z)',
        'btn-redo': 'やり直し (Ctrl+Y)',
        'btn-search': '検索 / 置換 (Ctrl+F)',
        'btn-cut': '切り取り (Ctrl+X)',
        'btn-copy': 'コピー (Ctrl+C)',
        'btn-paste': '貼り付け (Ctrl+V)',
        'btn-copy-all': 'すべてコピー',
        'btn-readonly': '読み取り専用',
        'btn-zoom-out': '縮小 (Ctrl+-)',
        'btn-zoom-in': '拡大 (Ctrl++)',
        'btn-zen': '禅モード (全画面) (F11)',
        'btn-markdown': 'Markdown 切り替え (Ctrl+M)',
        'btn-add-tab': '新しいタブ',
        'btn-undo-tab': '閉じたタブを復元 (Ctrl+Shift+T)',
        'ui-lang-select': 'UI 言語',
        'lang-select': '構文のハイライト',
        'theme-select': 'テーマの変更',
        'status-ready': '準備完了',
        'status-saving': '保存中...',
        'status-saved': '保存しました',
        'status-error': 'エラー発生',
        'search-title': '検索と置換',
        'search-placeholder': '検索...',
        'replace-placeholder': '置換...',
        'btn-replace': '置換',
        'btn-replace-all': 'すべて置換',
        'stats-char': '文字',
        'stats-word': '単語',
        'stats-line': '行',
        'stats-col': '列',
        'confirm-msg': '保存されていない変更があります。<br>保存しますか？',
        'btn-confirm-save': '保存',
        'btn-confirm-discard': '破棄',
        'btn-confirm-cancel': 'キャンセル',
        'label-wordwrap': '折返し'
    },
    'zh-TW': {
        'btn-new': '新檔案 (Ctrl+N)',
        'btn-open': '開啟檔案 (Ctrl+O)',
        'btn-save': '儲存 (Ctrl+S)',
        'btn-save-as': '另存新檔 (Ctrl+Shift+S)',
        'btn-backup': '備份工作區 (.json)',
        'btn-restore': '還原工作區',
        'btn-print': '列印 PDF (Ctrl+P)',
        'btn-undo': '復原 (Ctrl+Z)',
        'btn-redo': '重做 (Ctrl+Y)',
        'btn-search': '尋找與取代 (Ctrl+F)',
        'btn-cut': '剪下 (Ctrl+X)',
        'btn-copy': '複製 (Ctrl+C)',
        'btn-paste': '貼上 (Ctrl+V)',
        'btn-copy-all': '複製全部',
        'btn-readonly': '唯讀模式',
        'btn-zoom-out': '縮小 (Ctrl+-)',
        'btn-zoom-in': '放大 (Ctrl++)',
        'btn-zen': '全螢幕模式 (F11)',
        'btn-markdown': '切換 Markdown (Ctrl+M)',
        'btn-add-tab': '新增分頁',
        'btn-undo-tab': '還原關閉的分頁 (Ctrl+Shift+T)',
        'ui-lang-select': '介面語言',
        'lang-select': '語法高亮',
        'theme-select': '變更主題',
        'status-ready': '準備就緒',
        'status-saving': '儲存中...',
        'status-saved': '已儲存',
        'status-error': '發生錯誤',
        'search-title': '尋找與取代',
        'search-placeholder': '尋找...',
        'replace-placeholder': '取代為...',
        'btn-replace': '取代',
        'btn-replace-all': '全部取代',
        'stats-char': '字元',
        'stats-word': '單字',
        'stats-line': '行',
        'stats-col': '列',
        'confirm-msg': '您有未儲存的變更。<br>是否要儲存？',
        'btn-confirm-save': '儲存',
        'btn-confirm-discard': '不儲存',
        'btn-confirm-cancel': '取消',
        'label-wordwrap': '換行'
    },
    'zh-CN': {
        'btn-new': '新文件 (Ctrl+N)',
        'btn-open': '打开文件 (Ctrl+O)',
        'btn-save': '保存 (Ctrl+S)',
        'btn-save-as': '另存为 (Ctrl+Shift+S)',
        'btn-backup': '备份工作区 (.json)',
        'btn-restore': '恢复工作区',
        'btn-print': '打印 PDF (Ctrl+P)',
        'btn-undo': '撤销 (Ctrl+Z)',
        'btn-redo': '重做 (Ctrl+Y)',
        'btn-search': '查找与替换 (Ctrl+F)',
        'btn-cut': '剪切 (Ctrl+X)',
        'btn-copy': '复制 (Ctrl+C)',
        'btn-paste': '粘贴 (Ctrl+V)',
        'btn-copy-all': '复制全部',
        'btn-readonly': '只读模式',
        'btn-zoom-out': '缩小 (Ctrl+-)',
        'btn-zoom-in': '放大 (Ctrl++)',
        'btn-zen': '全屏模式 (F11)',
        'btn-markdown': '切换 Markdown (Ctrl+M)',
        'btn-add-tab': '新标签页',
        'btn-undo-tab': '恢复关闭的标签页 (Ctrl+Shift+T)',
        'ui-lang-select': '界面语言',
        'lang-select': '语法高亮',
        'theme-select': '更改主题',
        'status-ready': '准备就绪',
        'status-saving': '保存中...',
        'status-saved': '已保存',
        'status-error': '发生错误',
        'search-title': '查找与替换',
        'search-placeholder': '查找...',
        'replace-placeholder': '替换为...',
        'btn-replace': '替换',
        'btn-replace-all': '全部替换',
        'stats-char': '字符',
        'stats-word': '单词',
        'stats-line': '行',
        'stats-col': '列',
        'confirm-msg': '您有未保存的更改。<br>是否要保存？',
        'btn-confirm-save': '保存',
        'btn-confirm-discard': '不保存',
        'btn-confirm-cancel': '取消',
        'label-wordwrap': '换行'
    }
};

let closedTabs = []; // For Undo Tab Close
let cm; // CodeMirror instance

if (!appData.activeTabId && appData.tabs.length > 0) {
    appData.activeTabId = appData.tabs[0].id;
}

// DOM Elements
const editorTextarea = document.getElementById('editor');
const preview = document.getElementById('preview');
const tabContainer = document.getElementById('tab-container');
const btnAddTab = document.getElementById('btn-add-tab');
const btnUndoTab = document.getElementById('btn-undo-tab');
const cursorPosEl = document.getElementById('cursor-pos');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const statusMsgEl = document.getElementById('status-msg');
const themeSelect = document.getElementById('theme-select');
const langSelect = document.getElementById('lang-select');
const btnMarkdown = document.getElementById('btn-markdown');
const btnReadonly = document.getElementById('btn-readonly');
const fileInput = document.getElementById('file-input');
const restoreInput = document.getElementById('restore-input');

// [v2.5.1] IndexedDB 저장 함수 (2차 감사 반영)
// [2차 감사 1] 비상 백업 세션당 1회 제한 (emergencyTriggered 플래그)
// [2차 감사 2] FileHandle 객체 원복 — IndexedDB는 structured clone으로 정상 직렬화 지원
let emergencyTriggered = false; // 비상 백업 스팸 방지 플래그

async function saveToStorage() {
    // FileHandle 객체는 IndexedDB의 structured clone으로 완벽하게 직렬화됨
    // null 처리 시 새로고침마다 파일 연결 상태가 초기화되는 UX 퇴행 발생 (2차 감사에서 발견)
    const dataToSave = { ...appData };
    try {
        await localforage.setItem(STORAGE_KEY, dataToSave);
        const savedMsg = i18nDict[appData.uiLang] ? i18nDict[appData.uiLang]['status-saved'] : '저장됨';
        showStatus(savedMsg);
    } catch (err) {
        console.error('Save to IndexedDB failed', err);
        const errMsg = i18nDict[appData.uiLang] ? i18nDict[appData.uiLang]['status-error'] : '저장 오류';
        // [2차 감사 1] 비상 백업 세션당 1회만 실행
        // 저장소 용량 초과 시 2초마다 자동저장 트리거로 무한 다운로드 스팸 방지
        if (!emergencyTriggered) {
            emergencyTriggered = true;
            showStatus(errMsg + ' - 비상 백업 1회 다운로드');
            try {
                // 비상 백업용 데이터에서는 handle을 제외 (JSON 직렬화 불가)
                const backupData = { ...appData, tabs: appData.tabs.map(t => ({ ...t, handle: null })) };
                const emergencyData = JSON.stringify(backupData, null, 2);
                const blob = new Blob([emergencyData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `webmemo_emergency_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
            } catch (backupErr) {
                console.error('Emergency backup also failed', backupErr);
            }
        } else {
            showStatus(errMsg + ' - 용량 부족 (데이터 정리 필요)');
        }
    }
}

// Load from IndexedDB
async function loadFromStorage() {
    try {
        const data = await localforage.getItem(STORAGE_KEY);
        if (data) {
            // Support backwards compatibility for older JSON strings
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            appData = { ...appData, ...parsed };
        }
    } catch (e) {
        console.error('Failed to parse local storage data', e);
    }
}

function applyLanguage(langCode) {
    if (!i18nDict[langCode]) langCode = 'ko'; // fallback
    const dict = i18nDict[langCode];

    // Toolbars & Buttons
    for (const [id, text] of Object.entries(dict)) {
        const el = document.getElementById(id);
        if (el) {
            if (el.hasAttribute('title')) el.setAttribute('title', text);
            if (el.tagName === 'SPAN' && el.id === 'search-title') el.textContent = text;
            if (el.tagName === 'BUTTON' && el.id === 'btn-replace') el.textContent = text;
            if (el.tagName === 'BUTTON' && el.id === 'btn-replace-all') el.textContent = text;
            if (el.tagName === 'SPAN' && el.id === 'search-status') el.textContent = '';
        }
    }

    // Placeholders
    const searchInput = document.getElementById('search-input');
    const replaceInput = document.getElementById('replace-input');
    if (searchInput) searchInput.setAttribute('placeholder', dict['search-placeholder']);
    if (replaceInput) replaceInput.setAttribute('placeholder', dict['replace-placeholder']);

    // Status Default
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg && statusMsg.textContent === i18nDict[appData.uiLang]['status-ready']) {
        statusMsg.textContent = dict['status-ready'];
    }

    // [감사 1-2] confirm modal innerHTML → textContent + DOM API로 변경
    // 향후 i18n 딕셔너리에 사용자 입력이 혼입될 경우의 잠재적 XSS 벡터 원천 제거
    const cMsg = document.getElementById('confirm-msg');
    if (cMsg) {
        cMsg.textContent = '';
        const parts = (dict['confirm-msg'] || '').split('<br>');
        parts.forEach((part, i) => {
            cMsg.appendChild(document.createTextNode(part));
            if (i < parts.length - 1) cMsg.appendChild(document.createElement('br'));
        });
    }
    const cSave = document.getElementById('btn-confirm-save');
    if (cSave) cSave.textContent = dict['btn-confirm-save'];
    const cDiscard = document.getElementById('btn-confirm-discard');
    if (cDiscard) cDiscard.textContent = dict['btn-confirm-discard'];
    const cCancel = document.getElementById('btn-confirm-cancel');
    if (cCancel) cCancel.textContent = dict['btn-confirm-cancel'];

    // Label override
    const mdLabel = document.getElementById('label-markdown');
    if (mdLabel) mdLabel.textContent = "Markdown";
    // [v2.4.0] Word Wrap 토글 레이블 다국어 적용
    const wrapLabel = document.getElementById('label-wordwrap');
    if (wrapLabel) wrapLabel.textContent = dict['label-wordwrap'] || 'Wrap';

    // Update active dropdown
    const uiLangSelect = document.getElementById('ui-lang-select');
    if (uiLangSelect) uiLangSelect.value = langCode;

    appData.uiLang = langCode;

    // Force stats update on language change
    if (cm) {
        updateStats();
        // Force cursor coordinate string translation update
        const head = cm.state.selection.main.head;
        const line = cm.state.doc.lineAt(head);
        const strLine = i18nDict[appData.uiLang]['stats-line'] || 'Ln';
        const strCol = i18nDict[appData.uiLang]['stats-col'] || 'Col';
        cursorPosEl.textContent = `${strLine}: ${line.number} | ${strCol}: ${head - line.from + 1}`;
    }
}

// Language Map for Auto Detection
async function autoDetectSyntax(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    // Find language in CM6 languages data
    const langDesc = languages.find(l => l.extensions.includes(ext) || l.name.toLowerCase() === ext);
    let mime = 'text/plain';

    if (langDesc) {
        try {
            const langSupport = await langDesc.load();
            cm.dispatch({ effects: languageConf.reconfigure(langSupport) });
            mime = langDesc.name;
        } catch (e) { console.error('Failed to load language', e); }
    } else {
        cm.dispatch({ effects: languageConf.reconfigure([]) });
    }

    const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
    if (activeTab) {
        activeTab.lang = mime;

        // Ensure option exists in dropdown, else create it
        let optionExists = Array.from(langSelect.options).some(opt => opt.value === mime);
        if (!optionExists) {
            const newOption = document.createElement('option');
            newOption.value = mime;
            newOption.textContent = mime;
            langSelect.appendChild(newOption);
        }
        langSelect.value = mime;

        if (ext === 'md' || ext === 'markdown') {
            appData.markdownMode = true;
            btnMarkdown.classList.add('active');
            preview.classList.remove('hidden');
        } else {
            appData.markdownMode = false;
            btnMarkdown.classList.remove('active');
            preview.classList.add('hidden');
        }
        updateMarkdownPreview();
        saveToStorage();
    }
}

// [v2.3.0] CodeMirror 6 초기화 함수 - 미니맵 확장 통합
// Replit의 codemirror-minimap 패키지를 extensions에 포함하여
// 에디터 우측에 VS Code 스타일의 축소 코드 미니뷰를 렌더링함
function initCodeMirror() {
    // 미니맵 인스턴스 생성 팩토리: 미니맵 컨테이너 DOM 요소를 반환
    const createMinimap = (v) => {
        const dom = document.createElement('div');
        return { dom };
    };

    cm = new EditorView({
        state: EditorState.create({
            doc: "",
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                drawSelection(),
                history(),
                bracketMatching(),
                closeBrackets(),
                keymap.of([indentWithTab, ...historyKeymap, ...defaultKeymap]),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                languageConf.of([]),
                readOnlyConf.of(EditorState.readOnly.of(false)),
                themeConf.of([]),
                fontConf.of([]),
                // [v2.4.0] Word Wrap Compartment: 사용자 설정에 따라 자동 줄바꿈 적용
                // ON 시 EditorView.lineWrapping으로 텍스트가 에디터 경계에서 줄바꿈
                wrapConf.of(appData.wordWrap ? EditorView.lineWrapping : []),
                EditorState.allowMultipleSelections.of(true),
                // [v2.3.0] 미니맵(스크롤 미니뷰) 확장 등록
                // displayText: 'blocks' → 코드를 추상적 블록으로 축소 표현 (가독성 및 성능 최적화)
                // showOverlay: 'always' → 현재 뷰포트 위치를 반투명 사각형으로 항상 표시
                showMinimap.compute(['doc'], (state) => {
                    return {
                        create: createMinimap,
                        displayText: 'blocks',
                        showOverlay: 'always',
                    };
                }),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        window.searchLastQuery = null;
                        window.searchAllMatches = [];

                        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
                        if (activeTab && activeTab.content !== cm.state.doc.toString()) {
                            activeTab.content = cm.state.doc.toString();
                            updateMarkdownPreview();
                            updateStats();
                            const ui = document.querySelector(`.tab[data-id="${activeTab.id}"] .tab-title`);
                            if (ui) ui.classList.add('modified');
                            activeTab.isModified = true;
                            showStatus(i18nDict[appData.uiLang]['status-saving'] || '작성중...');
                            clearTimeout(window.saveTimer);
                            window.saveTimer = setTimeout(() => { saveToStorage(); }, 2000);
                        }
                    }
                    if (update.selectionSet || update.docChanged) {
                        const head = update.state.selection.main.head;
                        const line = update.state.doc.lineAt(head);
                        const strLine = i18nDict[appData.uiLang]['stats-line'] || 'Ln';
                        const strCol = i18nDict[appData.uiLang]['stats-col'] || 'Col';
                        cursorPosEl.textContent = `${strLine}: ${line.number} | ${strCol}: ${head - line.from + 1}`;
                    }
                }),
                EditorView.domEventHandlers({
                    scroll: (e, view) => {
                        if (!appData.markdownMode) return;
                        const scrollInfo = view.scrollDOM;
                        const scrollPercentage = scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight);
                        if (!isNaN(scrollPercentage)) {
                            preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
                        }
                    }
                })
            ]
        }),
        parent: document.querySelector('.editor-wrapper')
    });
    // CM6 에디터로 대체되므로 원본 textarea 숨김
    editorTextarea.style.display = 'none';
}
function updateStats() {
    const text = cm.state.doc.toString();
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const strChar = i18nDict[appData.uiLang]['stats-char'] || 'Char';
    const strWord = i18nDict[appData.uiLang]['stats-word'] || 'Word';
    charCountEl.textContent = `${strChar}: ${chars}`;
    wordCountEl.textContent = `${strWord}: ${words}`;
}



function setFontSize(size) {
    if (size < 10) size = 10;
    if (size > 40) size = 40;
    appData.fontSize = size;
    document.querySelector('.cm-editor').style.fontSize = `${size}px`;
    preview.style.fontSize = `${size}px`;
    // cm.refresh() not needed in CM6;
    saveToStorage();
    showStatus(`글꼴 크기: ${size}px`);
}

function setTheme(themeName) {
    appData.theme = themeName;
    document.body.setAttribute('data-theme', themeName);
    saveToStorage();
}

// Tab Management
function renderTabs() {
    tabContainer.innerHTML = '';

    appData.tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab' + (tab.id === appData.activeTabId ? ' active' : '');
        tabEl.dataset.id = tab.id;

        let displayTitle = tab.title || '무제 ' + (index + 1);

        tabEl.innerHTML = `
            <span class="tab-title ${tab.readonly ? 'readonly' : ''} ${tab.isModified ? 'modified' : ''}" title="${displayTitle}">${displayTitle}</span>
            <button class="tab-close" data-id="${tab.id}"><i class="ph ph-x"></i></button>
        `;

        tabEl.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close')) return;
            switchTab(tab.id);
        });

        // Double click to rename tab & trigger syntax highlight
        tabEl.addEventListener('dblclick', (e) => {
            e.preventDefault();
            const currentName = tab.title || displayTitle;
            const newName = prompt('탭 이름 변경 (확장자 포함 시 구문 색상이 자동 감지됩니다):', currentName);
            if (newName && newName.trim() !== '') {
                tab.title = newName.trim();
                renderTabs();

                // If it's the active tab, immediately apply new syntax
                if (tab.id === appData.activeTabId) {
                    autoDetectSyntax(tab.title);
                }
                saveToStorage();
                showStatus(`탭 이름 변경됨: ${tab.title}`);
            }
        });

        tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            requestCloseTab(tab.id);
        });

        tabContainer.appendChild(tabEl);
    });

    // Undo btn visibilty mostly logic
}

function switchTab(id) {
    appData.activeTabId = id;
    renderTabs();
    loadActiveTabContent();
    saveToStorage();
}

let pendingCloseTabId = null;

function requestCloseTab(id) {
    const tab = appData.tabs.find(t => t.id === id);
    if (!tab) return;

    if (tab.isModified) {
        pendingCloseTabId = id;
        document.getElementById('confirm-modal').classList.remove('hidden');
    } else {
        closeTab(id);
    }
}

function closeTab(id) {
    const tabToClose = appData.tabs.find(t => t.id === id);
    if (!tabToClose) return;

    closedTabs.push({ ...tabToClose }); // Save to short-term history array
    if (closedTabs.length > 20) closedTabs.shift(); // Max 20 history

    if (appData.tabs.length === 1) {
        appData.tabs = [{ id: 'tab_' + Date.now(), title: '무제 1', content: '', lang: 'text/plain', readonly: false, handle: null }];
        appData.activeTabId = appData.tabs[0].id;
    } else {
        const index = appData.tabs.findIndex(t => t.id === id);
        appData.tabs = appData.tabs.filter(t => t.id !== id);
        if (appData.activeTabId === id) {
            appData.activeTabId = appData.tabs[Math.max(0, index - 1)].id;
        }
    }
    renderTabs();
    loadActiveTabContent();
    saveToStorage();
    showStatus('탭 닫힘');
}

function addTab(title = '새 문서', content = '', lang = 'text/plain', handle = null) {
    const newTab = {
        id: 'tab_' + Date.now(),
        title: title,
        content: content,
        lang: lang,
        readonly: false,
        isModified: false,
        handle: handle
    };
    appData.tabs.push(newTab);
    appData.activeTabId = newTab.id;
    renderTabs();
    loadActiveTabContent();
    saveToStorage();
    if (handle) autoDetectSyntax(title);
    cm.focus();
}

function undoCloseTab() {
    if (closedTabs.length > 0) {
        const tabToRestore = closedTabs.pop();
        appData.tabs.push(tabToRestore);
        appData.activeTabId = tabToRestore.id;
        renderTabs();
        loadActiveTabContent();
        saveToStorage();
        showStatus('닫은 탭 복구됨');
    } else {
        showStatus('복구할 탭이 없습니다.');
    }
}

// Editor Functions
function loadActiveTabContent() {
    const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
    if (activeTab) {
        cm.dispatch({ changes: { from: 0, to: cm.state.doc.length, insert: activeTab.content || '' } });

        const lName = activeTab.lang || 'text/plain';
        const lgDesc = languages.find(l => l.name === lName || l.name.toLowerCase() === lName.toLowerCase() || (l.alias && l.alias.includes(lName.toLowerCase())));
        if (lgDesc) {
            lgDesc.load().then(ls => cm.dispatch({ effects: languageConf.reconfigure(ls) }));
        } else {
            cm.dispatch({ effects: languageConf.reconfigure([]) });
        }
        cm.dispatch({ effects: readOnlyConf.reconfigure(EditorState.readOnly.of(!!activeTab.readonly)) });
        langSelect.value = activeTab.lang || 'text/plain';
        if (activeTab.readonly) btnReadonly.classList.add('active');
        else btnReadonly.classList.remove('active');
    }
    updateMarkdownPreview();
    updateStats();

    // Clear modification indicator
    const currentTabUI = document.querySelector(`.tab[data-id="${appData.activeTabId}"] .tab-title`);
    if (currentTabUI) currentTabUI.classList.remove('modified');
    // setTimeout(() => // cm.refresh() not needed in CM6, 10);
}

function updateActiveTabContent() {
    const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
    if (activeTab) {
        activeTab.content = cm.state.doc.toString();
        saveToStorage();
        updateMarkdownPreview();
        renderTabs(); // updates titles
    }
}

// [v2.5.1] 마크다운 프리뷰 갱신 함수 (2차 감사 반영)
// DOMPurify 훅으로 target="_blank" 링크에 noopener noreferrer 자동 부여
function updateMarkdownPreview() {
    if (appData.markdownMode) {
        const docText = cm.state.doc.toString() || '';
        // [감사 4-2] 대용량 문서(100KB 초과) 프리뷰 보호
        if (docText.length > 100000) {
            preview.textContent = '⚠️ 문서가 너무 큽니다 (100KB 초과). 마크다운 프리뷰가 비활성화되었습니다.';
            return;
        }
        // [2차 감사 3] DOMPurify afterSanitizeAttributes 훅
        // target="_blank" 링크에 rel="noopener noreferrer" 자동 부여하여
        // window.opener 취약점을 통한 외부 페이지 조작 공격 방지
        DOMPurify.addHook('afterSanitizeAttributes', (node) => {
            if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
                node.setAttribute('rel', 'noopener noreferrer');
            }
        });
        preview.innerHTML = DOMPurify.sanitize(marked.parse(docText));
        DOMPurify.removeHook('afterSanitizeAttributes');
    }
}

let statusTimeout;
function showStatus(msg) {
    statusMsgEl.textContent = msg;
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        statusMsgEl.textContent = '준비됨';
    }, 2000);
}

// Native File System API Operations
const fileOptions = {
    types: [
        {
            description: 'Text Files',
            accept: {
                'text/plain': ['.txt', '.md', '.json', '.js', '.html', '.css', '.py', '.c', '.cpp', '.rs', '.cs', '.java', '.sql']
            },
        },
    ],
};

async function handleOpenFile() {
    try {
        if (window.showOpenFilePicker) {
            const [handle] = await window.showOpenFilePicker(fileOptions);
            const file = await handle.getFile();
            const content = await file.text();
            addTab(file.name, content, 'text/plain', handle);
            showStatus('파일 열기 성공');
        } else {
            // Fallback for HTTP / Unsupported browsers
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.md,.json,.js,.html,.css,.py,.c,.cpp,.rs,.cs,.java,.sql';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    addTab(file.name, ev.target.result, 'text/plain', null);
                    showStatus('파일 열기 성공 (HTTP 호환 모드)');
                };
                reader.readAsText(file);
            };
            input.click();
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('File open error:', err);
            showStatus('파일 열기 실패');
        }
    }
}

async function handleSaveFile(saveAs = false) {
    const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
    if (!activeTab) return;

    // [감사 3] 수동 저장 시 자동 저장 디바운스 타이머 선행 클리어
    // 자동 저장 타이머가 만료되는 시점과 수동 저장이 동시 실행되는 경쟁 조건(Race Condition) 방지
    clearTimeout(window.saveTimer);

    try {
        let suggestedName = activeTab.title;
        if (suggestedName.includes('무제') || suggestedName.includes('새 문서')) {
            const newName = prompt('파일 이름을 지정해주세요 (미리 구문 색상이 적용됩니다):', "untitled.txt");
            if (newName && newName.trim() !== '') {
                // [감사 4-1] OS 파일명 금지 특수문자 자동 치환
                // \ / : * ? " < > | 를 언더스코어로 대체하여 AbortError 방지
                suggestedName = newName.trim().replace(/[\\/:*?"<>|]/g, '_');
                activeTab.title = suggestedName;
                renderTabs();
                autoDetectSyntax(suggestedName);
            } else {
                return; // Cancelled
            }
        }

        if (window.showSaveFilePicker) {
            let handle = activeTab.handle;

            // Verify permission if handle exists from DB
            if (handle && !saveAs) {
                const opts = { mode: 'readwrite' };
                if ((await handle.queryPermission(opts)) !== 'granted') {
                    if ((await handle.requestPermission(opts)) !== 'granted') {
                        throw new Error('Permission denied by user');
                    }
                }
            }

            if (!handle || saveAs) {
                let suggestedName = activeTab.title;
                if (suggestedName.includes('무제') || suggestedName.includes('새 문서')) {
                    suggestedName = "untitled.txt";
                }
                handle = await window.showSaveFilePicker({
                    ...fileOptions,
                    suggestedName: suggestedName
                });
                activeTab.handle = handle;
                activeTab.title = handle.name;
            }

            const writable = await handle.createWritable();
            await writable.write(activeTab.content);
            await writable.close();

            // Remove modification star and auto-detect syntax based on new name
            activeTab.isModified = false;
            const currentTabUI = document.querySelector(`.tab[data-id="${appData.activeTabId}"] .tab-title`);
            if (currentTabUI) currentTabUI.classList.remove('modified');
            autoDetectSyntax(handle.name);

            renderTabs(); // Refresh titles
            saveToStorage();
            showStatus('네이티브 저장 성공');
        } else {
            // Fallback: Download via blob
            let suggestedName = activeTab.title;
            if (suggestedName.includes('무제') || suggestedName.includes('새 문서')) {
                suggestedName = "untitled.txt";
            }

            // Re-use downloadFile logic
            const blob = new Blob([activeTab.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);

            activeTab.isModified = false;
            const currentTabUI = document.querySelector(`.tab[data-id="${appData.activeTabId}"] .tab-title`);
            if (currentTabUI) currentTabUI.classList.remove('modified');

            showStatus('다운로드 저장 성공 (HTTP 호환 모드)');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('File save error:', err);
            showStatus('저장에 실패했습니다 (권한 필요)');
        }
    }
}

// Workspace JSON Downloader (Fallback)
function downloadFile(content, extension, mimeType, suggestedTitle) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suggestedTitle}.${extension}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function backupWorkspace() {
    const dateStr = new Date().toISOString().slice(0, 10);
    const dataToBackup = { ...appData };
    dataToBackup.tabs = dataToBackup.tabs.map(t => ({ ...t, handle: null })); // remove non-json handles
    downloadFile(JSON.stringify(dataToBackup, null, 2), 'json', 'application/json', `webmemo_ws_${dateStr}`);
    showStatus('워크스페이스 백업 완료');
}

// Setup Event Listeners
function setupEventListeners() {
    btnAddTab.addEventListener('click', () => addTab());
    btnUndoTab.addEventListener('click', undoCloseTab);

    // Zoom
    document.getElementById('btn-zoom-in').addEventListener('click', () => setFontSize(appData.fontSize + 2));
    document.getElementById('btn-zoom-out').addEventListener('click', () => setFontSize(appData.fontSize - 2));

    // Zen Mode
    document.getElementById('btn-zen').addEventListener('click', () => {
        document.body.classList.toggle('zen-mode');
        // cm.refresh() not needed in CM6;
        showStatus('젠 모드 토글 (F11)');
    });

    // Theme Selector
    themeSelect.addEventListener('change', (e) => setTheme(e.target.value));

    // Language Selector
    langSelect.addEventListener('change', (e) => {
        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
        if (activeTab) {
            activeTab.lang = e.target.value;
            const langDesc = languages.find(l => l.name === activeTab.lang || l.name.toLowerCase() === activeTab.lang.toLowerCase() || (l.alias && l.alias.includes(activeTab.lang.toLowerCase())));
            if (langDesc) {
                langDesc.load().then(ls => cm.dispatch({ effects: languageConf.reconfigure(ls) }));
            } else {
                cm.dispatch({ effects: languageConf.reconfigure([]) });
            }

            // Toggle Markdown Mode
            if (activeTab.lang === 'Markdown') {
                appData.markdownMode = true;
                btnMarkdown.classList.add('active');
                preview.classList.remove('hidden');
                updateMarkdownPreview();
            } else {
                appData.markdownMode = false;
                btnMarkdown.classList.remove('active');
                preview.classList.add('hidden');
            }

            saveToStorage();
            showStatus(`언어: ${e.target.options[e.target.selectedIndex].text}`);
        }
    });

    // UI Language Selector (i18n)
    const uiLangSelect = document.getElementById('ui-lang-select');
    if (uiLangSelect) {
        uiLangSelect.addEventListener('change', (e) => {
            applyLanguage(e.target.value);
            saveToStorage();
            showStatus(i18nDict[appData.uiLang]['status-ready'] || '준비됨');
        });
    }

    // Markdown Toggle
    btnMarkdown.addEventListener('click', () => {
        appData.markdownMode = !appData.markdownMode;
        if (appData.markdownMode) {
            btnMarkdown.classList.add('active');
            preview.classList.remove('hidden');
        } else {
            btnMarkdown.classList.remove('active');
            preview.classList.add('hidden');
        }
        updateMarkdownPreview();
        saveToStorage();
        // cm.refresh() not needed in CM6;
    });

    // [v2.4.0] Word Wrap 슬라이딩 토글 스위치 이벤트 핸들러
    // 체크박스 상태 변경 시 Compartment의 reconfigure로 즉시 적용 (에디터 재생성 없음)
    const toggleWordwrap = document.getElementById('toggle-wordwrap');
    if (toggleWordwrap) {
        toggleWordwrap.addEventListener('change', (e) => {
            appData.wordWrap = e.target.checked;
            // Compartment reconfigure로 런타임 동적 줄바꿈 토글
            cm.dispatch({
                effects: wrapConf.reconfigure(
                    appData.wordWrap ? EditorView.lineWrapping : []
                )
            });
            saveToStorage();
            const statusMsg = appData.wordWrap
                ? (i18nDict[appData.uiLang]['label-wordwrap'] || 'Wrap') + ' ON'
                : (i18nDict[appData.uiLang]['label-wordwrap'] || 'Wrap') + ' OFF';
            showStatus(statusMsg);
        });
    }
    // Toolbar Basic Action
    document.getElementById('btn-new').addEventListener('click', () => addTab());
    document.getElementById('btn-save').addEventListener('click', () => handleSaveFile(false));
    document.getElementById('btn-save-as').addEventListener('click', () => handleSaveFile(true));
    document.getElementById('btn-open').addEventListener('click', handleOpenFile);

    // Backup & Restore
    document.getElementById('btn-backup').addEventListener('click', backupWorkspace);
    document.getElementById('btn-restore').addEventListener('click', () => restoreInput.click());
    restoreInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.tabs) {
                    appData = parsed;
                    await saveToStorage();

                    // Full refresh layout
                    cm.destroy();
                    editorTextarea.value = '';
                    closedTabs = [];
                    initApp();

                    showStatus('워크스페이스 복원됨');
                }
            } catch (err) {
                alert('유효하지 않은 백업 파일입니다.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Print
    document.getElementById('btn-print').addEventListener('click', () => window.print());

    // Editor Commands (Cut, Copy, Paste, Undo, Redo, Search)
    document.getElementById('btn-undo').addEventListener('click', () => undo(cm));
    document.getElementById('btn-redo').addEventListener('click', () => redo(cm));

    document.getElementById('btn-search').addEventListener('click', () => {
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');
        searchModal.classList.remove('hidden');
        searchInput.focus();
        searchInput.select();
    });

    document.getElementById('btn-cut').addEventListener('click', () => {
        const selection = cm.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to);
        if (selection) {
            navigator.clipboard.writeText(selection).then(() => {
                cm.dispatch(cm.state.replaceSelection(''));
                showStatus(i18nDict[appData.uiLang]['status-ready'] || '잘라내기 완료');
            }).catch(e => showStatus('권한 거부됨'));
        }
    });

    document.getElementById('btn-copy').addEventListener('click', () => {
        const selection = cm.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to);
        if (selection) {
            navigator.clipboard.writeText(selection).then(() => showStatus(i18nDict[appData.uiLang]['status-ready'] || '복사 완료'))
                .catch(e => showStatus('권한 거부됨'));
        }
    });

    document.getElementById('btn-paste').addEventListener('click', () => {
        navigator.clipboard.readText().then(text => {
            if (text) {
                cm.dispatch(cm.state.replaceSelection(text));
                showStatus(i18nDict[appData.uiLang]['status-ready'] || '붙여넣기 완료');
            }
        }).catch(e => showStatus('권한 거부됨'));
    });

    document.getElementById('btn-copy-all').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(cm.state.doc.toString());
            showStatus('전체 클립보드 복사됨');
        } catch (e) {
            showStatus('클립보드 권한 거부됨');
        }
    });

    // Readonly Lock
    btnReadonly.addEventListener('click', () => {
        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
        if (activeTab) {
            activeTab.readonly = !activeTab.readonly;
            cm.dispatch({ effects: readOnlyConf.reconfigure(EditorState.readOnly.of(!!activeTab.readonly)) });
            if (activeTab.readonly) btnReadonly.classList.add('active');
            else btnReadonly.classList.remove('active');
            renderTabs();
            saveToStorage();
            showStatus(activeTab.readonly ? '읽기 전용 모드' : '편집 가능');
        }
    });

    // Keyboard Shortcuts Override
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            undoCloseTab();
        } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            handleSaveFile(true);
        } else if (e.key === 'F11') {
            e.preventDefault();
            document.getElementById('btn-zen').click();
        } else if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 's': e.preventDefault(); handleSaveFile(false); break;
                case 'n': e.preventDefault(); addTab(); break;
                case 'o': e.preventDefault(); handleOpenFile(); break;
                case 'm': e.preventDefault(); btnMarkdown.click(); break;
                case 'p': e.preventDefault(); window.print(); break;
            }
        }
    });

    // Window Resize fixes CM layout
    window.addEventListener('resize', () => { /* cm.refresh() not needed in CM6 */ });

    // Confirm Modal Events
    document.getElementById('btn-confirm-save').addEventListener('click', async () => {
        if (pendingCloseTabId) {
            document.getElementById('confirm-modal').classList.add('hidden');
            if (appData.activeTabId !== pendingCloseTabId) {
                switchTab(pendingCloseTabId);
            }
            try {
                await handleSaveFile(false);
                closeTab(pendingCloseTabId);
                pendingCloseTabId = null;
            } catch (e) {
                console.warn("Save cancelled, tab will remain open.");
            }
        }
    });

    document.getElementById('btn-confirm-discard').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.add('hidden');
        if (pendingCloseTabId) {
            closeTab(pendingCloseTabId);
            pendingCloseTabId = null;
        }
    });

    document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.add('hidden');
        pendingCloseTabId = null;
    });
}

// ==========================================
// Custom Floating Search Controller
// ==========================================
function setupSearchController() {
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const replaceInput = document.getElementById('replace-input');
    const searchStatus = document.getElementById('search-status');

    // Override default Ctrl+F
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            searchModal.classList.remove('hidden');
            searchInput.focus();
            searchInput.select();
        }
    });

    // Close Button
    document.getElementById('btn-search-close').addEventListener('click', () => {
        searchModal.classList.add('hidden');
        cm.focus();
    });

    // Core Search Execution (using CM6 SearchCursor)
    window.searchLastQuery = null;
    window.searchMatchIndex = -1;
    window.searchAllMatches = [];

    function doSearch(reverse = false) {
        const query = searchInput.value;
        if (!query) return;

        if (query !== window.searchLastQuery || window.searchAllMatches.length === 0) {
            window.searchAllMatches = [];
            let cur = new SearchCursor(cm.state.doc, query);
            while (!cur.next().done) {
                window.searchAllMatches.push({ from: cur.value.from, to: cur.value.to });
            }
            window.searchLastQuery = query;

            if (window.searchAllMatches.length === 0) {
                searchStatus.textContent = i18nDict[appData.uiLang]['status-error'] || '결과 없음';
                return;
            }
        }

        let pos = cm.state.selection.main.head;
        let idx = window.searchAllMatches.findIndex(m => m.from >= pos);

        if (reverse) {
            idx = window.searchAllMatches.findIndex(m => m.from >= pos) - 1;
            if (idx < 0) idx = window.searchAllMatches.length - 1;
        } else {
            // Find next strict
            idx = window.searchAllMatches.findIndex(m => m.from > pos);
            if (idx === -1) idx = 0;
        }

        if (idx !== -1 && idx < window.searchAllMatches.length) {
            let found = window.searchAllMatches[idx];
            cm.dispatch({
                selection: { anchor: found.from, head: found.to },
                effects: EditorView.scrollIntoView(found.from, { y: "center" })
            });
            window.searchMatchIndex = idx;
            searchStatus.textContent = `${idx + 1} / ${window.searchAllMatches.length}`;
        }
    }

    document.getElementById('btn-search-next').addEventListener('click', () => doSearch(false));
    document.getElementById('btn-search-prev').addEventListener('click', () => doSearch(true));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch(e.shiftKey);
        if (e.key === 'Escape') document.getElementById('btn-search-close').click();
    });

    // Replace Logic
    document.getElementById('btn-replace').addEventListener('click', () => {
        const query = searchInput.value;
        const replacement = replaceInput.value;
        if (!query) return;

        const mainSel = cm.state.selection.main;
        const selectedText = cm.state.sliceDoc(mainSel.from, mainSel.to);

        if (selectedText === query) {
            cm.dispatch({
                changes: { from: mainSel.from, to: mainSel.to, insert: replacement },
                selection: { anchor: mainSel.from, head: mainSel.from + replacement.length },
                scrollIntoView: true
            });
            searchStatus.textContent = i18nDict[appData.uiLang]['status-ready'] || '변경됨';
            window.searchLastQuery = null; // force fresh search next time
        } else {
            doSearch(false);
        }
    });

    document.getElementById('btn-replace-all').addEventListener('click', () => {
        const query = searchInput.value;
        const replacement = replaceInput.value;
        if (!query) return;

        window.searchAllMatches = [];
        let cur = new SearchCursor(cm.state.doc, query);
        while (!cur.next().done) {
            window.searchAllMatches.push({ from: cur.value.from, to: cur.value.to });
        }

        if (window.searchAllMatches.length > 0) {
            let changes = window.searchAllMatches.map(m => ({ from: m.from, to: m.to, insert: replacement }));

            let diff = replacement.length - query.length;
            let ranges = window.searchAllMatches.map((m, i) => {
                let newFrom = m.from + i * diff;
                let newTo = newFrom + replacement.length;
                return EditorSelection.range(newFrom, newTo);
            });

            cm.dispatch({
                changes: changes,
                selection: EditorSelection.create(ranges),
                scrollIntoView: true
            });
            searchStatus.textContent = `${window.searchAllMatches.length}개 변경됨`;
            window.searchLastQuery = null;
        } else {
            searchStatus.textContent = i18nDict[appData.uiLang]['status-error'] || '결과 없음';
        }
    });

    // Handle Escape Key anywhere to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
            searchModal.classList.add('hidden');
            searchStatus.textContent = '';
            cm.focus(); // Return focus to editor
        }
    });
}

// [v2.2.0] 앱 초기화 함수
async function initApp() {
    // localforage 설정 (IndexedDB 식별용)
    localforage.config({
        name: 'WebMemoPro',
        storeName: 'workspace_data'
    });

    // [v2.2.0] marked.js 전역 옵션 설정
    // breaks: true → 싱글 줄바꿈(\n)을 <br>로 변환하여 에디터 줄바꿈이 프리뷰에 즉시 반영되도록 함
    // gfm: true → GitHub Flavored Markdown 사양 적용 (테이블, 취소선, 자동 링크 등)
    // 이전에는 기본값(breaks: false)으로 인해 # 제목 앞뒤 줄바꿈이 무시되어
    // 제목이 본문과 합쳐져 보이거나, ---가 Setext 헤딩으로 오인되는 문제가 발생함
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    await loadFromStorage();
    initCodeMirror();

    // 설정 적용
    setTheme(appData.theme);
    themeSelect.value = appData.theme;
    setFontSize(appData.fontSize);

    // UI 언어 적용
    applyLanguage(appData.uiLang);

    if (appData.markdownMode) {
        btnMarkdown.classList.add('active');
        preview.classList.remove('hidden');
    }

    // [v2.4.0] 저장된 Word Wrap 설정 복원
    // IndexedDB에서 불러온 appData.wordWrap 값으로 토글 스위치 UI를 동기화
    const toggleWordwrap = document.getElementById('toggle-wordwrap');
    if (toggleWordwrap && appData.wordWrap) {
        toggleWordwrap.checked = true;
    }

    renderTabs();
    loadActiveTabContent();
}

// Start Application Lifecycle
async function bootstrap() {
    await loadCM6();
    await initApp();
    setupEventListeners();
    setupSearchController();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
