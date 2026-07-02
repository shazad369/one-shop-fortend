// ✅ সঠিক ফেচ - CORS সমস্যা সমাধান
window.fetch = new Proxy(window.fetch, {
  apply: async function(target, thisArg, argumentsList) {
    const [input, init = {}] = argumentsList;

    const headers = new Headers(init.headers || {});
    headers.set('x-api-key', 'one-shop-secret-key-change-this');
    headers.set('localtonet-skip-warning', 'true');

    return target.call(thisArg, input, {
      ...init,
      headers,
      mode: 'cors',
      credentials: 'omit',
    });
  }
});
