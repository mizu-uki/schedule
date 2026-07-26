/*
  インストール可能にするための最小Service Worker。

  ★キャッシュは持たない。それどころか HTTP キャッシュも積極的に迂回する。
    GitHub Pages は HTML に max-age=600 を返すため、何もしないと
    「予定を更新したのに最大10分間 古い内容が表示される」ことが起きる。
    予定は1日に何度も直すので、オフライン対応より“常に最新”を優先する。
*/
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var isDoc = req.mode === 'navigate';                    // index.html 本体
  var isToday = req.url.indexOf('today.html') !== -1;     // 日々差し替わる予定
  if(!isDoc && !isToday) return;                          // それ以外は既定動作

  // cache:'no-store' で HTTP キャッシュを迂回して取り直す。
  // 失敗（オフライン等）したら通常の取得にフォールバックし、ページを壊さない。
  e.respondWith(
    fetch(req, { cache: 'no-store' }).catch(function(){ return fetch(req); })
  );
});
