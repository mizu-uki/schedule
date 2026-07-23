/*
  インストール可能にするための最小Service Worker。
  ★あえてキャッシュしない（ネットワーク素通し）。
    today.html は毎日中身が変わるため、キャッシュすると「昨日の予定が出る」事故が起きる。
    オフライン対応より“常に最新”を優先する。
*/
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){ /* 何もしない = ブラウザ既定のネットワーク取得 */ });
