// [v3.0.0] WebMemo Pro Service Worker
// PWA 오프라인 캐싱 전략: Network First + Cache Fallback
// CDN 리소스(CodeMirror, Mermaid, KaTeX 등)를 캐싱하여 완전 오프라인 구동 지원

const CACHE_NAME = 'webmemo-v3.0.0';

// 핵심 앱 파일 (앱 쉘)
const APP_SHELL = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json',
    './icons/icon-512.png'
];

// CDN 리소스 (초기 캐싱 대상)
const CDN_RESOURCES = [
    'https://cdn.jsdelivr.net/npm/marked@15.0.6/marked.min.js',
    'https://cdn.jsdelivr.net/npm/dompurify@3.0.8/dist/purify.min.js',
    'https://cdn.jsdelivr.net/npm/mermaid@11.12.3/dist/mermaid.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/contrib/auto-render.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js'
];

// 설치 이벤트: 앱 쉘 캐싱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // 앱 쉘은 반드시 캐싱
            return cache.addAll(APP_SHELL).then(() => {
                // CDN은 실패해도 설치 차단하지 않음 (네트워크 없을 수 있음)
                return Promise.allSettled(
                    CDN_RESOURCES.map((url) => cache.add(url).catch(() => { }))
                );
            });
        })
    );
    // 대기 없이 즉시 활성화
    self.skipWaiting();
});

// 활성화 이벤트: 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    // 모든 탭에 즉시 적용
    self.clients.claim();
});

// Fetch 이벤트: Network First 전략
// 네트워크 우선 시도 → 실패 시 캐시 Fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // POST 등 비-GET 요청은 캐싱하지 않음
    if (request.method !== 'GET') return;

    // ESM import (esm.sh) — 캐싱 대상
    const isESM = request.url.includes('esm.sh');
    // CDN 리소스 — 캐싱 대상
    const isCDN = request.url.includes('cdn.jsdelivr.net') ||
        request.url.includes('cdnjs.cloudflare.com') ||
        request.url.includes('fonts.googleapis.com') ||
        request.url.includes('fonts.gstatic.com');
    // 로컬 앱 파일
    const isLocal = request.url.includes(self.location.origin);

    if (isLocal || isCDN || isESM) {
        event.respondWith(
            // 네트워크 우선 시도
            fetch(request).then((response) => {
                // 성공 시 캐시에 저장 (다음 오프라인용)
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            }).catch(() => {
                // 네트워크 실패 → 캐시에서 제공
                return caches.match(request).then((cached) => {
                    return cached || new Response('오프라인 - 리소스를 찾을 수 없습니다', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
        );
    }
});
