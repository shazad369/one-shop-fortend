// ✅ সঠিক ফেচ - CORS সমস্যা সমাধান
window.fetch = new Proxy(window.fetch, {
    apply: async function(target, thisArg, argumentsList) {
        const [input, init = {}] = argumentsList;
        
        // CORS হেডার ঠিক করা
        const headers = new Headers(init.headers || {});
        headers.set('x-api-key', 'one-shop-secret-key-change-this');
        
        // DEFAULT মোড ব্যবহার করুন (cors না)
        return target.call(thisArg, input, {
            ...init,
            headers,
            mode: 'same-origin', // বা 'no-cors'
            credentials: 'include'
        });
    }
});
