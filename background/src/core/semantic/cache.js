export class CustomCache {
    constructor(cacheName) {
        this.cacheName = cacheName;
    }

    async match(request) {
        const url = request instanceof Request ? request.url : request;
        const cached = await chrome.storage.local.get([url]);
        if (cached[url]) {
            return await fetch(cached[url]._body);
        }
        return undefined;
    }

    async put(request, response) {
        const url = request instanceof Request ? request.url : request;
        const buffer = await response.arrayBuffer();

        const body = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e.target.error);
            reader.readAsDataURL(new Blob([buffer], { type: 'application/octet-stream' }));
        });

        try {
            await chrome.storage.local.set({
                [url]: {
                    _body: body,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    url: response.url,
                    type: response.type,
                    ok: response.ok,
                }
            });
        } catch (err) {
            console.warn('Cache write error in custom cache:', err);
        }
    }
}