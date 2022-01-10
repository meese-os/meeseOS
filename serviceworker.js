var CACHE_NAME = 'servicecache-' + location.host + '-v1';
var urlsToCache = [
	'servicecache.txt'
];

self.addEventListener('install', function (event) {
	// Perform install steps
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function (cache) {
				console.log('Opened cache');
				return cache.addAll(urlsToCache);
			})
	);
});

self.addEventListener('fetch', function (event) {
	if (event.request.url.indexOf(".js") > -1 || event.request.url.indexOf(".css") > -1) {
		event.respondWith(
			fetch(event.request).then((netResponse) => {
				return netResponse;
			})
		);
	}
});