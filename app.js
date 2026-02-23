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
// [v2.8.0] Vim 에뮬레이터 (@replit/codemirror-vim)
let vim;

let languageConf;
let readOnlyConf;
let themeConf;
let fontConf;
// [v2.4.0] Word Wrap(자동 줄바꿈) 동적 토글용 Compartment
let wrapConf;
// [v2.8.0] Vim 모드 동적 토글용 Compartment
let vimConf;

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

    // [v2.8.0] Replit 제작 CodeMirror 6 Vim 에뮬레이터 동적 로딩
    // Normal/Insert/Visual 모드, :w, :q 등 Vim 커맨드 지원
    const vimModule = await import("https://esm.sh/@replit/codemirror-vim");
    vim = vimModule.vim;
    const Vim = vimModule.Vim;

    // [v2.8.0 패치] Vim :w/:wq 커맨드 → WebMemo 네이티브 저장 브릿지
    // Vim 유저가 습관적으로 :w 입력 시 handleSaveFile() 호출
    Vim.defineEx('write', 'w', () => {
        handleSaveFile(false);
    });
    Vim.defineEx('wq', 'wq', async () => {
        await handleSaveFile(false);
        // 저장 후 현재 탭 닫기 시도
        requestCloseTab(appData.activeTabId);
    });

    languageConf = new Compartment();
    readOnlyConf = new Compartment();
    themeConf = new Compartment();
    fontConf = new Compartment();
    // [v2.4.0] Word Wrap Compartment
    wrapConf = new Compartment();
    // [v2.8.0] Vim Compartment: 런타임에 Vim 모드를 동적 on/off
    vimConf = new Compartment();
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
    wordWrap: false, // [v2.4.0] Word Wrap 상태 (기본: OFF, 코딩 시 줄바꿈 없음)
    vimMode: false // [v2.8.0] Vim 모드 상태 (기본: OFF, 일반 사용자 보호)
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
        'label-wordwrap': '줄바꿈',
        'prompt-rename': '탭 이름 변경 (확장자 포함 시 구문 색상이 자동 감지됩니다):',
        'msg-tab-renamed': '탭 이름 변경됨',
        'msg-tab-reordered': '탭 순서 변경됨',
        'msg-tab-closed': '탭 닫힘',
        'msg-tab-restored': '닫은 탭 복구됨',
        'msg-no-tab-restore': '복구할 탭이 없습니다',
        'msg-file-opened': '파일 열기 성공',
        'msg-file-saved': '저장 성공',
        'msg-file-downloaded': '다운로드 저장 성공 (호환 모드)',
        'msg-file-save-failed': '저장 실패 (권한 필요)',
        'msg-backup-done': '워크스페이스 백업 완료',
        'msg-backup-restored': '워크스페이스 복원됨',
        'msg-backup-invalid': '유효하지 않은 백업 파일입니다',
        'msg-clipboard-copied': '전체 클립보드 복사됨',
        'msg-clipboard-denied': '클립보드 권한 거부됨',
        'msg-readonly-locked': '🔒 읽기 전용 모드',
        'msg-zen-toggle': '젠 모드 (F11)',
        'msg-zen-exit': '젠 모드 종료',
        'msg-vim-on': '⌨️ Vim 모드 켜짐 (ESC → 명령 모드)',
        'msg-vim-off': '일반 모드',
        'msg-text-only': '텍스트 파일만 열 수 있습니다',
        'prompt-save-name': '파일 이름을 지정해주세요 (구문 색상이 자동 적용됩니다):',
        'toc-title': '목차'
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
        'label-wordwrap': 'Wrap',
        'prompt-rename': 'Rename tab (include extension for auto syntax detection):',
        'msg-tab-renamed': 'Tab renamed',
        'msg-tab-reordered': 'Tab reordered',
        'msg-tab-closed': 'Tab closed',
        'msg-tab-restored': 'Closed tab restored',
        'msg-no-tab-restore': 'No tab to restore',
        'msg-file-opened': 'File opened',
        'msg-file-saved': 'Saved successfully',
        'msg-file-downloaded': 'Downloaded (compatibility mode)',
        'msg-file-save-failed': 'Save failed (permission required)',
        'msg-backup-done': 'Workspace backup complete',
        'msg-backup-restored': 'Workspace restored',
        'msg-backup-invalid': 'Invalid backup file',
        'msg-clipboard-copied': 'All text copied to clipboard',
        'msg-clipboard-denied': 'Clipboard permission denied',
        'msg-readonly-locked': '🔒 Read-only mode',
        'msg-zen-toggle': 'Zen Mode (F11)',
        'msg-zen-exit': 'Exited Zen Mode',
        'msg-vim-on': '⌨️ Vim mode ON (ESC → Normal mode)',
        'msg-vim-off': 'Normal mode',
        'msg-text-only': 'Only text files can be opened',
        'prompt-save-name': 'Enter file name (syntax coloring will apply):',
        'toc-title': 'Contents'
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
        'label-wordwrap': '折返し',
        'prompt-rename': 'タブ名を変更 (拡張子を含めると構文が自動検出されます):',
        'msg-tab-renamed': 'タブ名を変更しました',
        'msg-tab-reordered': 'タブの順序を変更しました',
        'msg-tab-closed': 'タブを閉じました',
        'msg-tab-restored': '閉じたタブを復元しました',
        'msg-no-tab-restore': '復元するタブがありません',
        'msg-file-opened': 'ファイルを開きました',
        'msg-file-saved': '保存しました',
        'msg-file-downloaded': 'ダウンロード保存 (互換モード)',
        'msg-file-save-failed': '保存に失敗しました (権限が必要)',
        'msg-backup-done': 'ワークスペースのバックアップ完了',
        'msg-backup-restored': 'ワークスペースを復元しました',
        'msg-backup-invalid': '無効なバックアップファイルです',
        'msg-clipboard-copied': 'すべてクリップボードにコピー',
        'msg-clipboard-denied': 'クリップボードの権限が拒否されました',
        'msg-readonly-locked': '🔒 読み取り専用モード',
        'msg-zen-toggle': '禅モード (F11)',
        'msg-zen-exit': '禅モードを終了しました',
        'msg-vim-on': '⌨️ Vimモード ON (ESC → ノーマルモード)',
        'msg-vim-off': 'ノーマルモード',
        'msg-text-only': 'テキストファイルのみ開けます',
        'prompt-save-name': 'ファイル名を入力してください (構文カラーが自動適用されます):',
        'toc-title': '目次'
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
        'label-wordwrap': '換行',
        'prompt-rename': '重新命名分頁 (包含副檔名可自動偵測語法):',
        'msg-tab-renamed': '分頁已重新命名',
        'msg-tab-reordered': '分頁已重新排序',
        'msg-tab-closed': '分頁已關閉',
        'msg-tab-restored': '已還原關閉的分頁',
        'msg-no-tab-restore': '沒有可還原的分頁',
        'msg-file-opened': '檔案已開啟',
        'msg-file-saved': '儲存成功',
        'msg-file-downloaded': '下載儲存成功 (相容模式)',
        'msg-file-save-failed': '儲存失敗 (需要權限)',
        'msg-backup-done': '工作區備份完成',
        'msg-backup-restored': '工作區已還原',
        'msg-backup-invalid': '無效的備份檔案',
        'msg-clipboard-copied': '全部複製到剪貼簿',
        'msg-clipboard-denied': '剪貼簿權限被拒絕',
        'msg-readonly-locked': '🔒 唯讀模式',
        'msg-zen-toggle': '全螢幕模式 (F11)',
        'msg-zen-exit': '已退出全螢幕模式',
        'msg-vim-on': '⌨️ Vim 模式開啟 (ESC → 命令模式)',
        'msg-vim-off': '一般模式',
        'msg-text-only': '僅能開啟文字檔案',
        'prompt-save-name': '請輸入檔案名稱 (語法色彩將自動套用):',
        'toc-title': '目錄'
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
        'label-wordwrap': '换行',
        'prompt-rename': '重命名标签页 (包含扩展名可自动检测语法):',
        'msg-tab-renamed': '标签页已重命名',
        'msg-tab-reordered': '标签页已重新排序',
        'msg-tab-closed': '标签页已关闭',
        'msg-tab-restored': '已恢复关闭的标签页',
        'msg-no-tab-restore': '没有可恢复的标签页',
        'msg-file-opened': '文件已打开',
        'msg-file-saved': '保存成功',
        'msg-file-downloaded': '下载保存成功 (兼容模式)',
        'msg-file-save-failed': '保存失败 (需要权限)',
        'msg-backup-done': '工作区备份完成',
        'msg-backup-restored': '工作区已恢复',
        'msg-backup-invalid': '无效的备份文件',
        'msg-clipboard-copied': '全部复制到剪贴板',
        'msg-clipboard-denied': '剪贴板权限被拒绝',
        'msg-readonly-locked': '🔒 只读模式',
        'msg-zen-toggle': '全屏模式 (F11)',
        'msg-zen-exit': '已退出全屏模式',
        'msg-vim-on': '⌨️ Vim 模式已开启 (ESC → 命令模式)',
        'msg-vim-off': '普通模式',
        'msg-text-only': '仅能打开文本文件',
        'prompt-save-name': '请输入文件名 (语法颜色将自动应用):',
        'toc-title': '目录'
    }
};

// [v2.9.0] i18n 헬퍼: 딕셔너리 키를 간결하게 참조
// 사용법: t('msg-tab-closed') → 현재 언어에 맞는 문자열 반환
function t(key, fallback) {
    const dict = i18nDict[appData.uiLang] || i18nDict['ko'];
    return dict[key] || fallback || key;
}

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
    const dataToSave = { ...appData };
    try {
        await localforage.setItem(STORAGE_KEY, dataToSave);
        // [4차 감사 4] 저장 성공 시 비상 백업 플래그 초기화
        emergencyTriggered = false;

        // [v2.7.0] 로컬 타임머신: 탭별 최근 10개 스냅샷 자동 저장
        // 내용이 변경된 탭만 스냅샷 추가 (저장소 효율 유지)
        try {
            const snapshots = (await localforage.getItem('webmemo_snapshots')) || {};
            appData.tabs.forEach(tab => {
                if (!snapshots[tab.id]) snapshots[tab.id] = [];
                const history = snapshots[tab.id];
                const lastSnap = history.length > 0 ? history[history.length - 1] : null;
                // 마지막 스냅샷과 내용이 다를 때만 추가
                if (!lastSnap || lastSnap.content !== tab.content) {
                    history.push({
                        content: tab.content,
                        title: tab.title,
                        timestamp: new Date().toISOString()
                    });
                }
                // 최대 10개 유지 (FIFO) - push 수행 여부와 무관하게 항상 검사
                while (history.length > 10) history.shift();
            });
            // 삭제된 탭의 스냅샷 정리
            const activeIds = new Set(appData.tabs.map(t => t.id));
            Object.keys(snapshots).forEach(id => {
                if (!activeIds.has(id)) delete snapshots[id];
            });
            await localforage.setItem('webmemo_snapshots', snapshots);
        } catch (snapErr) {
            console.warn('Snapshot save failed (non-critical)', snapErr);
        }

        const savedMsg = i18nDict[appData.uiLang] ? i18nDict[appData.uiLang]['status-saved'] : '저장됨';
        showStatus(savedMsg);
    } catch (err) {
        console.error('Save to IndexedDB failed', err);
        const errMsg = i18nDict[appData.uiLang] ? i18nDict[appData.uiLang]['status-error'] : '저장 오류';
        // [2차 감사 1] 비상 백업 세션당 1회만 실행
        if (!emergencyTriggered) {
            emergencyTriggered = true;
            showStatus(errMsg + ' - 비상 백업 1회 다운로드');
            try {
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

// [5차 감사 1] 에디터 확장 배열 생성 함수 분리
// initCodeMirror와 loadActiveTabContent(탭 전환 시 setState)에서 공유 사용
// 탭 전환 시 EditorState를 새로 생성하여 History 스택을 초기화하고
// Undo/Redo 역사 출혈(History Bleed) 방지
function getEditorExtensions() {
    // 미니맵 인스턴스 생성 팩토리
    const createMinimap = (v) => {
        const dom = document.createElement('div');
        return { dom };
    };

    return [
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
        wrapConf.of(appData.wordWrap ? EditorView.lineWrapping : []),
        // [v2.8.0] Vim 모드 확장 (Opt-in: 기본 OFF)
        vimConf.of(appData.vimMode ? vim() : []),
        // [v3.0.0 패치] Mac Vim Enter 방어 + Vim 한글 키맵 프록시
        // 1. Mac에서 Normal 모드 Enter가 newline을 삽입하는 버그 방어
        // 2. 한글 입력 상태에서 Vim Normal/Visual 모드 명령어 자동 변환
        //    예: ㅐ→i, ㅈ→w, ㅁ→a 등 (두벌식 키보드 레이아웃 기준)
        EditorView.domEventHandlers({
            keydown(e, view) {
                if (!appData.vimMode) return false;

                // Vim 모드 상태 감지: codemirror-vim이 추가하는 CSS 클래스
                const editorEl = view.dom;
                const isNormal = editorEl.classList.contains('cm-vim-mode-normal') ||
                    !!editorEl.querySelector('.cm-vim-mode-normal');
                const isVisual = editorEl.classList.contains('cm-vim-mode-visual') ||
                    !!editorEl.querySelector('.cm-vim-mode-visual');

                // [Mac Enter 방어] Normal 모드에서 Enter 기본 동작(newline) 차단
                if (e.key === 'Enter' && isNormal) {
                    e.preventDefault();
                    return false;
                }

                // [한글 키맵] Normal/Visual 모드에서만 한글→영문 변환
                // Insert 모드에서는 한글이 그대로 입력되어야 하므로 변환하지 않음
                if ((isNormal || isVisual) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // IME 조합 중(composing)이면 건너뛰기
                    if (e.isComposing || e.keyCode === 229) return false;

                    // 두벌식 한/영 키 매핑 테이블 (자음 + 모음 + Shift 조합)
                    const koEnMap = {
                        // 자음 (ㄱ~ㅎ)
                        'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't',
                        'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
                        'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g',
                        'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
                        'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b',
                        'ㅜ': 'n', 'ㅡ': 'm',
                        // Shift + 자음 (쌍자음)
                        'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T',
                        // Shift + 모음
                        'ㅒ': 'O', 'ㅖ': 'P'
                    };

                    const mapped = koEnMap[e.key];
                    if (mapped) {
                        e.preventDefault();
                        e.stopPropagation();
                        // 매핑된 영문 키로 새 KeyboardEvent 생성하여 Vim 엔진에 전달
                        const syntheticEvent = new KeyboardEvent('keydown', {
                            key: mapped,
                            code: `Key${mapped.toUpperCase()}`,
                            keyCode: mapped.toUpperCase().charCodeAt(0),
                            which: mapped.toUpperCase().charCodeAt(0),
                            shiftKey: mapped !== mapped.toLowerCase(),
                            bubbles: true,
                            cancelable: true
                        });
                        editorEl.dispatchEvent(syntheticEvent);
                        return true; // 이벤트 처리 완료
                    }
                }

                return false;
            }
        }),
        EditorState.allowMultipleSelections.of(true),
        showMinimap.compute(['doc'], (state) => ({
            create: createMinimap,
            displayText: 'blocks',
            showOverlay: 'always',
        })),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                window.searchLastQuery = null;
                window.searchAllMatches = [];

                const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
                if (activeTab && activeTab.content !== cm.state.doc.toString()) {
                    activeTab.content = cm.state.doc.toString();
                    // [v3.0.0 패치] 비동기 렌더링 Debounce (150ms)
                    // 빠른 타이핑 시 mermaid.render() 레이스 컨디션 방지
                    clearTimeout(window.markdownPreviewTimer);
                    window.markdownPreviewTimer = setTimeout(() => {
                        updateMarkdownPreview();
                    }, 150);
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
    ];
}

// CodeMirror 6 초기화 - getEditorExtensions() 활용
function initCodeMirror() {
    cm = new EditorView({
        state: EditorState.create({
            doc: "",
            extensions: getEditorExtensions()
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
    // [v3.0.0] Mermaid 테마 연동 (다크/라이트 자동 전환)
    if (typeof mermaid !== 'undefined') {
        const isDark = ['dark', 'monokai', 'solarized-dark'].includes(themeName);
        mermaid.initialize({
            startOnLoad: false,
            // [v3.0.0 패치] securityLevel: 'loose' — classDef 스타일링 허용
            // 보안은 DOMPurify 2차 살균이 담당 (FORBID_ATTR로 이벤트 핸들러 제거)
            securityLevel: 'loose',
            theme: isDark ? 'dark' : 'default',
            fontFamily: "'Inter', sans-serif",
            // [v3.0.0] quadrantChart 라벨-선 겹침 방지 (Inter 폰트 메트릭 보상)
            quadrantChart: {
                quadrantTextTopPadding: 15,
                xAxisLabelPadding: 20,
                yAxisLabelPadding: 20,
                quadrantPadding: 10,
                titlePadding: 15
            }
        });
    }
    saveToStorage();

    // [v3.0.0 패치] 테마 전환 시 Mermaid/KaTeX 색상 즉시 동기화
    // mermaid.initialize()는 설정만 변경하고 기존 SVG는 갱신하지 않으므로 강제 재렌더링 필요
    if (appData.markdownMode && typeof cm !== 'undefined' && cm) {
        updateMarkdownPreview();
    }
}

// Tab Management
function renderTabs() {
    tabContainer.innerHTML = '';

    appData.tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab' + (tab.id === appData.activeTabId ? ' active' : '');
        tabEl.dataset.id = tab.id;

        let displayTitle = tab.title || (newTabTitles[appData.uiLang] || 'Untitled') + ' ' + (index + 1);

        // [3차 감사 1] DOM-XSS 방지: innerHTML에 displayTitle을 직접 보간하지 않음
        // 악의적 파일명(예: <img onerror=alert(1)>.txt)이나 백업 JSON 변조를 통한
        // 스크립트 주입을 원천 차단. textContent로 안전하게 텍스트만 삽입
        tabEl.innerHTML = `
            <span class="tab-title ${tab.readonly ? 'readonly' : ''} ${tab.isModified ? 'modified' : ''}"></span>
            <button class="tab-close" data-id="${tab.id}"><i class="ph ph-x"></i></button>
        `;
        tabEl.querySelector('.tab-title').textContent = displayTitle;
        tabEl.querySelector('.tab-title').setAttribute('title', displayTitle);

        // 탭 클릭 → 탭 전환
        tabEl.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close')) return;
            switchTab(tab.id);
        });

        // 더블클릭 → 탭 이름 변경 + 구문 색상 자동 감지
        tabEl.addEventListener('dblclick', (e) => {
            e.preventDefault();
            const currentName = tab.title || displayTitle;
            const newName = prompt(t('prompt-rename'), currentName);
            if (newName && newName.trim() !== '') {
                tab.title = newName.trim();
                renderTabs();
                if (tab.id === appData.activeTabId) {
                    autoDetectSyntax(tab.title);
                }
                saveToStorage();
                showStatus(`${t('msg-tab-renamed')}: ${tab.title}`);
            }
        });

        // [v2.6.0] 탭 드래그&드롭 순서 변경
        // HTML5 Drag API로 외부 라이브러리 없이 네이티브 구현
        tabEl.setAttribute('draggable', 'true');
        tabEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', tab.id);
            tabEl.classList.add('dragging');
        });
        tabEl.addEventListener('dragend', () => {
            tabEl.classList.remove('dragging');
            // 모든 탭의 드래그오버 표시 제거
            document.querySelectorAll('.tab.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
        tabEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            tabEl.classList.add('drag-over');
        });
        tabEl.addEventListener('dragleave', () => {
            tabEl.classList.remove('drag-over');
        });
        tabEl.addEventListener('drop', (e) => {
            e.preventDefault();
            tabEl.classList.remove('drag-over');
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId === tab.id) return; // 자기 자신에게 드롭 무시
            const fromIdx = appData.tabs.findIndex(t => t.id === draggedId);
            const toIdx = appData.tabs.findIndex(t => t.id === tab.id);
            if (fromIdx === -1 || toIdx === -1) return;
            // 배열에서 이동: splice로 제거 후 새 위치에 삽입
            const [moved] = appData.tabs.splice(fromIdx, 1);
            appData.tabs.splice(toIdx, 0, moved);
            renderTabs();
            saveToStorage();
            showStatus(t('msg-tab-reordered'));
        });

        tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            requestCloseTab(tab.id);
        });

        tabContainer.appendChild(tabEl);
    });

    // Undo btn visibilty mostly logic
}

// [v2.6.0] 탭 전환 시 현재 탭의 스크롤 위치를 저장하고 새 탭의 위치를 복원
function switchTab(id) {
    // 현재 탭의 스크롤 위치 저장
    const currentTab = appData.tabs.find(t => t.id === appData.activeTabId);
    if (currentTab && cm) {
        currentTab.scrollTop = cm.scrollDOM.scrollTop;
    }
    appData.activeTabId = id;
    renderTabs();
    loadActiveTabContent();
    saveToStorage();
}

let pendingCloseTabId = null;

function requestCloseTab(id) {
    // [4차 감사 3] 확인 모달 논블로킹 레이스 컨디션 방지
    // 모달이 이미 떠 있을 때 다른 탭 닫기 요청이 들어오면 pendingCloseTabId가 덮어씌워지는 문제 방지
    if (!document.getElementById('confirm-modal').classList.contains('hidden')) return;

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
    showStatus(t('msg-tab-closed'));
}

// [5차 감사 4] 새 탭 제목 i18n 연동
// 외국어 사용자가 새 탭을 열 때 한국어 '새 문서'로 고정되는 문제 해결
const newTabTitles = { 'ko': '새 문서', 'en': 'Untitled', 'ja': '新規', 'zh-TW': '新檔案', 'zh-CN': '新文件' };

function addTab(title = null, content = '', lang = 'text/plain', handle = null) {
    const defaultTitle = title || (newTabTitles[appData.uiLang] || 'Untitled');
    const newTab = {
        id: 'tab_' + Date.now(),
        title: defaultTitle,
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
    if (handle) autoDetectSyntax(title || defaultTitle);
    cm.focus();
    return newTab.id; // [7차 감사 2] 다중 파일 드롭 레이스 컨디션 방지용
}

function undoCloseTab() {
    if (closedTabs.length > 0) {
        const tabToRestore = closedTabs.pop();
        appData.tabs.push(tabToRestore);
        appData.activeTabId = tabToRestore.id;
        renderTabs();
        loadActiveTabContent();
        saveToStorage();
        showStatus(t('msg-tab-restored'));
    } else {
        showStatus(t('msg-no-tab-restore'));
    }
}

// [5차 감사 1] loadActiveTabContent: cm.setState()로 EditorState 완전 재생성
// dispatch로 텍스트만 교체하면 history 스택이 공유되어 탭간 Undo/Redo 혼선 발생
// setState()로 새 EditorState를 만들면 history()가 초기화되어 역사 출혈 방지
function loadActiveTabContent() {
    // [5차 감사 2] 탭 전환 시 검색 캐시 초기화
    // 이전 탭의 절대 좌표로 짧은 문서의 셀렉션을 이동하면 RangeError 발생
    window.searchLastQuery = null;
    window.searchAllMatches = [];

    const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
    if (activeTab) {
        // cm.setState()로 완전히 새로운 State 생성 (History 스택 초기화)
        cm.setState(EditorState.create({
            doc: activeTab.content || '',
            extensions: getEditorExtensions()
        }));

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

        // 현재 테마와 폰트 설정 재적용 (setState로 초기화되었으므로)
        setTheme(appData.theme);
        setFontSize(appData.fontSize);
    }
    updateMarkdownPreview();
    updateStats();

    // Clear modification indicator
    const currentTabUI = document.querySelector(`.tab[data-id="${appData.activeTabId}"] .tab-title`);
    if (currentTabUI) currentTabUI.classList.remove('modified');

    // [v2.6.0] 저장된 스크롤 위치 복원
    // setState() 후 DOM 렌더링이 완료된 후 스크롤 이동
    if (activeTab && activeTab.scrollTop) {
        requestAnimationFrame(() => {
            cm.scrollDOM.scrollTop = activeTab.scrollTop;
        });
    }
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

// [v3.0.0 패치] 렌더링 버전 토큰 (레이스 컨디션 방지)
// 비동기 렌더링 완료 시점에 현재 토큰과 일치해야만 DOM 업데이트 허용
let renderToken = 0;

// [5차 감사 3] 마크다운 프리뷰 갱신 함수
// DOMPurify 훅은 initApp()에서 1회만 등록 (메모리 누수 방지)
async function updateMarkdownPreview() {
    // 렌더링 버전 증가 — 이전에 시작된 비동기 렌더링을 무효화
    const currentToken = ++renderToken;
    const tocEl = document.getElementById('md-toc');
    if (appData.markdownMode) {
        const docText = cm.state.doc.toString() || '';
        // 대용량 문서(100KB 초과) 프리뷰 보호
        if (docText.length > 100000) {
            preview.textContent = '⚠️ 문서가 너무 큽니다 (100KB 초과). 마크다운 프리뷰가 비활성화되었습니다.';
            if (tocEl) tocEl.classList.add('hidden');
            return;
        }
        // [v3.0.0] Mermaid + KaTeX 통합 렌더링 파이프라인 (다중 패스 보호)
        // 보안 전략: 이중 살균 (Double Sanitize) 패턴
        // 0단계: 코드블록/인라인코드를 보호 (KaTeX 정규식 침범 방지)
        // 1단계: KaTeX 블록 수식($$...$$)을 placeholder로 분리 보관
        // 2단계: 코드블록 복원 (marked/Mermaid가 정상 파싱하도록)
        // 3단계: Mermaid 코드블록을 placeholder로 분리 보관
        // 4단계: DOMPurify 1차 살균 (일반 마크다운)
        // 5단계: placeholder에 Mermaid 원본 복원 → mermaid.render()
        // 6단계: 생성된 SVG를 DOMPurify 2차 살균
        // 7단계: KaTeX 블록 수식 복원 (katex.renderToString)
        // 8단계: KaTeX 인라인 수식 렌더링 (renderMathInElement)

        // [0단계] 코드블록 선행 보호 - KaTeX $$ 정규식이 코드 내 $$를 수식으로 오인하는 것 방지
        // 예: ```bash 내부의 echo $$ 가 수식으로 잘못 추출되는 버그 차단
        const codeBlockPhs = [];
        let codeProtected = docText.replace(/^[ ]{0,3}```[\s\S]*?^[ ]{0,3}```/gm, (match) => {
            const id = `cb-ph-${codeBlockPhs.length}`;
            codeBlockPhs.push({ id, content: match });
            return `<!--${id}-->`;
        });
        // 인라인 코드도 보호 (`$x$` 같은 코드 내 달러 기호 침범 방지)
        const inlineCodePhs = [];
        codeProtected = codeProtected.replace(/`[^`]+`/g, (match) => {
            const id = `ic-ph-${inlineCodePhs.length}`;
            inlineCodePhs.push({ id, content: match });
            return `<!--${id}-->`;
        });

        // [1단계] KaTeX 블록 수식($$...$$) placeholder 보호
        // marked.parse()가 여러 줄 $$...$$ 블록을 <p> 태그로 분리하여
        // renderMathInElement이 쌍을 인식하지 못하는 문제 방지
        const katexBlocks = [];
        const katexExtracted = codeProtected.replace(/\$\$([\s\S]*?)\$\$/gm, (match, formula) => {
            const id = `katex-ph-${Math.random().toString(36).substring(2, 11)}-${katexBlocks.length}`;
            katexBlocks.push({ id, formula: formula.trim() });
            return `<div id="${id}" class="katex-placeholder"></div>`;
        });

        // [2단계] 코드블록/인라인코드 복원 (Mermaid 추출 + marked가 정상 파싱하도록)
        let katexProtected = katexExtracted;
        for (const ph of inlineCodePhs) {
            katexProtected = katexProtected.replace(`<!--${ph.id}-->`, ph.content);
        }
        for (const ph of codeBlockPhs) {
            katexProtected = katexProtected.replace(`<!--${ph.id}-->`, ph.content);
        }

        const mermaidBlocks = [];
        // Mermaid 코드블록을 placeholder로 교체 (DOMPurify가 삭제하지 않도록 보호)
        // [v3.0.0 패치] CommonMark 스펙0~3 스페이스 들여쓰기 허용 + DOM Clobbering 방지 난수 ID
        const processedText = katexProtected.replace(/^[ ]{0,3}```mermaid\s*\n([\s\S]*?)^[ ]{0,3}```/gm, (match, code, offset) => {
            const id = `mermaid-ph-${Math.random().toString(36).substring(2, 11)}-${mermaidBlocks.length}`;
            mermaidBlocks.push({ id, code: code.trim() });
            return `<div id="${id}" class="mermaid-placeholder"></div>`;
        });

        // marked 파싱 → DOMPurify 1차 살균 (Mermaid/KaTeX 원본은 이미 placeholder로 보호됨)
        const parsedHtml = marked.parse(processedText);
        preview.innerHTML = DOMPurify.sanitize(parsedHtml, {
            ADD_TAGS: ['div'],
            ADD_ATTR: ['id', 'class']
        });

        // Mermaid 렌더링 (placeholder 위치에 다이어그램 삽입)
        if (mermaidBlocks.length > 0 && typeof mermaid !== 'undefined') {
            for (const block of mermaidBlocks) {
                const placeholder = preview.querySelector(`#${block.id}`);
                if (placeholder) {
                    try {
                        // [v3.0.0 패치] Mermaid CJK 전처리기
                        // 차트 타입별 분기: quadrantChart와 xychart-beta의 따옴표 규칙이 다름
                        const cjkPattern = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/;
                        let processedCode = block.code;
                        if (cjkPattern.test(processedCode)) {
                            // 차트 타입 감지 (첫 번째 비공백 줄)
                            const firstLine = processedCode.split('\n').find(l => l.trim())?.trim() || '';
                            const isXYChart = firstLine.startsWith('xychart');

                            processedCode = processedCode.split('\n').map(line => {
                                const trimmed = line.trim();

                                // title 처리: xychart-beta만 따옴표 필요 (quadrantChart는 리터럴 표시됨)
                                if (/^title\s+[^"]/.test(trimmed) && cjkPattern.test(trimmed) && isXYChart) {
                                    return line.replace(/^(\s*title\s+)(.+)$/, '$1"$2"');
                                }

                                // x-axis/y-axis "A" --> "B" 형태 (quadrantChart 축 범위)
                                if (/^[xy]-axis\s+[^"\[]/.test(trimmed) && cjkPattern.test(trimmed)) {
                                    if (trimmed.includes('-->')) {
                                        return line.replace(/^(\s*[xy]-axis\s+)([^"]+?)\s*-->\s*([^"]+)$/, '$1"$2" --> "$3"');
                                    }
                                }

                                // quadrant-1~4 라벨 (quadrantChart 전용)
                                if (/^quadrant-[1-4]\s+[^"]/.test(trimmed) && cjkPattern.test(trimmed)) {
                                    return line.replace(/^(\s*quadrant-[1-4]\s+)(.+)$/, '$1"$2"');
                                }

                                // xychart x-axis [1월, 2월] → ["1월", "2월"] (배열 내 CJK 항목 따옴표)
                                if (isXYChart && /^\s*x-axis\s+\[/.test(trimmed) && cjkPattern.test(trimmed)) {
                                    return line.replace(/\[([^\]]+)\]/, (m, inner) => {
                                        const items = inner.split(',').map(s => {
                                            const v = s.trim();
                                            return (v.startsWith('"') || !cjkPattern.test(v)) ? v : `"${v}"`;
                                        });
                                        return `[${items.join(', ')}]`;
                                    });
                                }

                                return line;
                            }).join('\n');
                        }
                        // Mermaid에게 SVG 렌더링 요청
                        const { svg } = await mermaid.render(`mermaid-svg-${block.id}`, processedCode);
                        // [v3.0.0 패치] 렌더 토큰 검증: await 사이에 새 렌더링이 시작되었으면 중단
                        if (currentToken !== renderToken) return;
                        // 2차 살균: Mermaid가 생성한 SVG에서 악성 스크립트 제거
                        placeholder.innerHTML = DOMPurify.sanitize(svg, {
                            USE_PROFILES: { svg: true, svgFilters: true },
                            ADD_TAGS: ['foreignObject'],
                            FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
                        });
                        placeholder.classList.add('mermaid-rendered');
                    } catch (err) {
                        // 잘못된 Mermaid 구문 시 에러 메시지 표시
                        placeholder.innerHTML = `<div class="mermaid-error">⚠️ Mermaid 구문 오류: ${DOMPurify.sanitize(err.message)}</div>`;
                    }
                }
            }
        }

        // [v3.0.0 패치] 렌더 토큰 검증: Mermaid 렌더링 완료 후 새 렌더링이 시작되었으면 중단
        if (currentToken !== renderToken) return;

        // [v3.0.0 패치] KaTeX 블록 수식 복원 (katex.renderToString 직접 렌더링)
        // marked.parse()에 의한 <p> 분리를 우회하여 여러 줄 블록 수식 정상 렌더링
        if (katexBlocks.length > 0 && typeof katex !== 'undefined') {
            for (const block of katexBlocks) {
                const placeholder = preview.querySelector(`#${block.id}`);
                if (placeholder) {
                    try {
                        // displayMode: true → 중앙 정렬 블록 수식
                        placeholder.outerHTML = katex.renderToString(block.formula, {
                            displayMode: true,
                            throwOnError: false
                        });
                    } catch (e) {
                        placeholder.outerHTML = `<div class="katex-error">⚠️ KaTeX 오류: ${DOMPurify.sanitize(e.message)}</div>`;
                    }
                }
            }
        }

        // KaTeX 인라인 수식 렌더링 ($...$만 처리, $$...$$ 블록은 위에서 직접 처리 완료)
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(preview, {
                delimiters: [
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false // 잘못된 수식은 빨간 텍스트로 표시 (크래시 방지)
            });
        }

        // [v2.7.0 패치] Floating TOC - 이벤트 위임(Event Delegation) 방식
        // 매 키입력마다 개별 아이템에 리스너를 다는 대신 부모에 1회 등록
        if (tocEl) {
            const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings.length > 0) {
                tocEl.classList.remove('hidden');
                tocEl.innerHTML = `<div class="md-toc-title">📑 ${t('toc-title', '목차')}</div>`;
                headings.forEach((h, idx) => {
                    const level = parseInt(h.tagName[1]);
                    const item = document.createElement('div');
                    item.className = 'md-toc-item md-toc-h' + level;
                    item.textContent = h.textContent;
                    item.title = h.textContent;
                    item.dataset.tocIdx = idx; // 이벤트 위임용 인덱스
                    tocEl.appendChild(item);
                });
            } else {
                tocEl.classList.add('hidden');
            }
        }
    } else {
        if (tocEl) tocEl.classList.add('hidden');
    }
}

let statusTimeout;
// [v2.6.0] 상태 메시지 표시 (i18n 버그 수정)
// 이전: 2초 후 하드코딩 '준비됨'으로 복귀 → 타 언어에서 한국어 표시
function showStatus(msg) {
    statusMsgEl.textContent = msg;
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        const readyMsg = (i18nDict[appData.uiLang] && i18nDict[appData.uiLang]['status-ready']) || '준비됨';
        statusMsgEl.textContent = readyMsg;
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
            showStatus(t('msg-file-opened'));
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
                    showStatus(t('msg-file-opened'));
                };
                reader.readAsText(file);
            };
            input.click();
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('File open error:', err);
            showStatus(t('status-error'));
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
            const newName = prompt(t('prompt-save-name', 'Enter file name (syntax coloring will apply):'), "untitled.txt");
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
            showStatus(t('msg-file-saved'));
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

            showStatus(t('msg-file-downloaded'));
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('File save error:', err);
            showStatus(t('msg-file-save-failed'));
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
    showStatus(t('msg-backup-done'));
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
        showStatus(t('msg-zen-toggle'));
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

    // [v2.8.0] Vim 모드 슬라이딩 토글 스위치 이벤트 핸들러
    // Compartment reconfigure로 런타임에 Vim 확장을 동적 on/off
    const toggleVim = document.getElementById('toggle-vim');
    if (toggleVim) {
        // 저장된 상태 복원
        toggleVim.checked = appData.vimMode;
        toggleVim.addEventListener('change', (e) => {
            appData.vimMode = e.target.checked;
            cm.dispatch({
                effects: vimConf.reconfigure(
                    appData.vimMode ? vim() : []
                )
            });
            saveToStorage();
            showStatus(appData.vimMode ? t('msg-vim-on') : t('msg-vim-off'));
        });
    }

    // [v2.7.0 패치] TOC 이벤트 위임: 부모 컨테이너에 1회만 등록
    // updateMarkdownPreview()에서 DOM을 매번 재생성해도 리스너가 누적되지 않음
    const tocContainer = document.getElementById('md-toc');
    if (tocContainer) {
        tocContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.md-toc-item');
            if (!item) return;
            const idx = parseInt(item.dataset.tocIdx);
            const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headings[idx]) {
                // [v3.0.0 패치] 프리뷰 컨테이너 내부 스크롤 (레이아웃 깨짐 방지)
                // offsetParent 체인을 순회하여 프리뷰 컨테이너 기준 절대 좌표 계산
                const previewEl = document.getElementById('preview');
                if (previewEl) {
                    let top = 0;
                    let el = headings[idx];
                    // offsetParent 체인을 따라가며 프리뷰까지의 누적 offsetTop 계산
                    while (el && el !== previewEl) {
                        top += el.offsetTop;
                        el = el.offsetParent;
                    }
                    previewEl.scrollTo({ top: Math.max(0, top - 16), behavior: 'smooth' });
                }
                // [쟌둥이 헤딩 수정] 문자열 검색 대신 n번째 헤딩 출현 순서로 정확한 라인 찾기
                // 동일한 텍스트의 헤딩이 여러 개 있어도 정확한 위치로 이동
                const docText = cm.state.doc.toString();
                const lines = docText.split('\n');
                const headingText = headings[idx].textContent.trim();
                let matchCount = 0; // 동일 헤딩 출현 횟수 카운터
                // 이 헤딩이 프리뷰에서 몇 번째 동일 헤딩인지 계산
                let targetOccurrence = 0;
                for (let h = 0; h < idx; h++) {
                    if (headings[h].textContent.trim() === headingText) targetOccurrence++;
                }
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].replace(/^#+\s*/, '').trim() === headingText) {
                        if (matchCount === targetOccurrence) {
                            const pos = cm.state.doc.line(i + 1).from;
                            cm.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
                            break;
                        }
                        matchCount++;
                    }
                }
            }
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

                    showStatus(t('msg-backup-restored'));
                }
            } catch (err) {
                alert(t('msg-backup-invalid'));
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

    // [7차 감사 1] 읽기 전용 모드에서 Cut/Paste 방어 가드
    // CM6 readOnly는 키보드 입력만 막고 cm.dispatch()로 주입되는 프로그래마톱 변경은 차단 못함
    document.getElementById('btn-cut').addEventListener('click', () => {
        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
        if (activeTab && activeTab.readonly) { showStatus(t('msg-readonly-locked')); return; }
        const selection = cm.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to);
        if (selection) {
            navigator.clipboard.writeText(selection).then(() => {
                cm.dispatch(cm.state.replaceSelection(''));
                showStatus(i18nDict[appData.uiLang]['status-ready'] || '잘라내기 완료');
            }).catch(e => showStatus(t('msg-clipboard-denied')));
        }
    });

    document.getElementById('btn-copy').addEventListener('click', () => {
        const selection = cm.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to);
        if (selection) {
            navigator.clipboard.writeText(selection).then(() => showStatus(i18nDict[appData.uiLang]['status-ready'] || '복사 완료'))
                .catch(e => showStatus(t('msg-clipboard-denied')));
        }
    });

    document.getElementById('btn-paste').addEventListener('click', () => {
        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
        if (activeTab && activeTab.readonly) { showStatus(t('msg-readonly-locked')); return; }
        navigator.clipboard.readText().then(text => {
            if (text) {
                cm.dispatch(cm.state.replaceSelection(text));
                showStatus(i18nDict[appData.uiLang]['status-ready'] || '붙여넣기 완료');
            }
        }).catch(e => showStatus(t('msg-clipboard-denied')));
    });

    document.getElementById('btn-copy-all').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(cm.state.doc.toString());
            showStatus(t('msg-clipboard-copied'));
        } catch (e) {
            showStatus(t('msg-clipboard-denied'));
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
            showStatus(activeTab.readonly ? t('msg-readonly-locked') : t('status-ready'));
        }
    });

    // Keyboard Shortcuts Override
    // [v3.0.0 패치] Mac Cmd 키 지원: ctrlKey || metaKey로 크로스 플랫폼 단축키
    document.addEventListener('keydown', (e) => {
        const modKey = e.ctrlKey || e.metaKey; // Ctrl(Win/Linux) 또는 Cmd(Mac)
        // [3차 감사 3] ESC 키로 젠 모드 탈출
        // [4차 감사 2] 검색/확인 모달이 열려있으면 젠 모드 종료 건너뛰기 (ESC 버블링 충돌 방지)
        if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) {
            const searchModal = document.getElementById('search-modal');
            const confirmModal = document.getElementById('confirm-modal');
            // 검색 모달이나 확인 모달이 열린 상태라면 젠 모드 탈출 억제 (모달만 닫히도록)
            if ((searchModal && !searchModal.classList.contains('hidden')) ||
                (confirmModal && !confirmModal.classList.contains('hidden'))) {
                return;
            }
            document.body.classList.remove('zen-mode');
            if (document.fullscreenElement) document.exitFullscreen();
            showStatus(t('msg-zen-exit'));
            return;
        }
        if (modKey && e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            undoCloseTab();
        } else if (modKey && e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            handleSaveFile(true);
        } else if (e.key === 'F11') {
            e.preventDefault();
            document.getElementById('btn-zen').click();
            // [v2.6.0] Ctrl+PageDown(다음 탭) / Ctrl+PageUp(이전 탭) 전환
            // Ctrl+Tab은 브라우저 시스템 단축키로 오버라이딩 불가
            // VS Code 표준 에디터 단축키 사용
        } else if (modKey && (e.key === 'PageDown' || e.key === 'PageUp')) {
            e.preventDefault();
            const currentIdx = appData.tabs.findIndex(t => t.id === appData.activeTabId);
            if (appData.tabs.length > 1) {
                let nextIdx;
                if (e.key === 'PageUp') {
                    // Ctrl+PageUp → 이전 탭 (순환)
                    nextIdx = (currentIdx - 1 + appData.tabs.length) % appData.tabs.length;
                } else {
                    // Ctrl+PageDown → 다음 탭 (순환)
                    nextIdx = (currentIdx + 1) % appData.tabs.length;
                }
                switchTab(appData.tabs[nextIdx].id);
            }
        } else if (modKey) {
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

    // [3차 감사 3] 브라우저 전체화면(ESC) 종료 시 젠 모드 클래스 동기화
    // 브라우저 네이티브 ESC로 전체화면을 빠져나와도 zen-mode 클래스가 남는 문제 방지
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && document.body.classList.contains('zen-mode')) {
            document.body.classList.remove('zen-mode');
            showStatus(t('msg-zen-exit'));
        }
    });

    // [3차 감사 2] 일반 텍스트 모드 인쇄 지원
    // CM6 가상 스크롤로 에디터 직접 인쇄 불가 → 인쇄 시 전체 텍스트를 프리뷰에 주입
    window.addEventListener('beforeprint', () => {
        if (!appData.markdownMode) {
            preview.classList.remove('hidden');
            // textContent 대신 pre 요소를 DOM으로 구성 (XSS 안전)
            const pre = document.createElement('pre');
            pre.style.cssText = 'white-space: pre-wrap; font-family: var(--font-mono); font-size: 12px; line-height: 1.5;';
            pre.textContent = cm.state.doc.toString();
            preview.textContent = '';
            preview.appendChild(pre);
        }
    });
    window.addEventListener('afterprint', () => {
        if (!appData.markdownMode) {
            preview.classList.add('hidden');
            preview.textContent = '';
        }
    });

    // [v2.7.0] 파일 드래그&드롭 오픈 (File DropZone)
    // [패치] 카운터 패턴으로 자식 요소 dragenter/dragleave 버블링에 의한 잔상 방지
    const contentArea = document.getElementById('content-area');
    let dragCounter = 0;
    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (e.dataTransfer.types.includes('Files')) {
            contentArea.classList.add('file-drop-active');
        }
    });
    document.addEventListener('dragleave', (e) => {
        dragCounter--;
        if (dragCounter === 0) {
            contentArea.classList.remove('file-drop-active');
        }
    });
    // dragover는 브라우저 기본 동작 방지 전용
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0; // 드롭 시 카운터 리셋
        contentArea.classList.remove('file-drop-active');
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        // [7차 감사 2] 다중 파일 드롭 레이스 컨디션 방지
        // 각 FileReader.onload에서 addTab이 반환하는 tabId를 캐처하여
        // 해당 탭으로 switchTab 후 구문 감지 (활성 탭에 의존하지 않음)
        Array.from(files).forEach(file => {
            const textExtensions = ['txt', 'md', 'markdown', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'htm', 'xml', 'json', 'py', 'java', 'c', 'cpp', 'h', 'rs', 'go', 'rb', 'php', 'sh', 'bat', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log', 'csv', 'sql', 'svg'];
            const ext = file.name.split('.').pop().toLowerCase();
            const isText = file.type.startsWith('text/') || textExtensions.includes(ext);
            if (!isText) {
                showStatus(`⚠️ ${file.name}: ${t('msg-text-only')}`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const newTabId = addTab(file.name, ev.target.result, 'text/plain');
                // 해당 탭으로 명시적 전환 후 구문 감지 (레이스 컨디션 방지)
                if (newTabId) switchTab(newTabId);
                autoDetectSyntax(file.name);
                showStatus(`📂 ${file.name} 열림`);
            };
            reader.readAsText(file);
        });
    });

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
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
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
        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
        if (activeTab && activeTab.readonly) { showStatus(t('msg-readonly-locked')); return; }
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
        const activeTab = appData.tabs.find(t => t.id === appData.activeTabId);
        if (activeTab && activeTab.readonly) { showStatus(t('msg-readonly-locked')); return; }
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

    // [v3.0.0] Mermaid.js 초기화 (다이어그램 렌더링 엔진)
    // startOnLoad: false → 자동 렌더링 방지 (updateMarkdownPreview에서 수동 제어)
    // securityLevel: 'loose' — classDef/subgraph 스타일링 허용 (DOMPurify 2차 살균으로 XSS 방어)
    if (typeof mermaid !== 'undefined') {
        const isDark = ['dark', 'monokai', 'solarized-dark'].includes(appData.theme);
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: isDark ? 'dark' : 'default',
            fontFamily: "'Inter', sans-serif",
            // quadrantChart 라벨-선 겹침 방지 (Inter 폰트 메트릭 보상)
            quadrantChart: {
                quadrantTextTopPadding: 15,
                xAxisLabelPadding: 20,
                yAxisLabelPadding: 20,
                quadrantPadding: 10,
                titlePadding: 15
            }
        });
    }

    // [5차 감사 3] DOMPurify 보안 훅 1회 등록 (앱 생명주기 동안 자동 적용)
    // target="_blank" 링크에 rel="noopener noreferrer" 자동 부여하여
    // window.opener 취약점을 통한 외부 페이지 조작 공격 방지
    // 이전: updateMarkdownPreview()마다 addHook/removeHook → 메모리 누수 위험
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
            node.setAttribute('rel', 'noopener noreferrer');
        }
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
