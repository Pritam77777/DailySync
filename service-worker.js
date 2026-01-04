const CACHE_NAME = 'dailysync-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/themes.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/database.js',
    '/js/theme.js',
    '/js/todos.js',
    '/js/calendar.js',
    '/js/notes.js',
    '/js/habits.js',
    '/js/timer.js',
    '/js/goals.js',
    '/js/routines.js'
];

// Install
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => {
            const fetched = fetch(e.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            }).catch(() => cached);
            return cached || fetched;
        })
    );
});
