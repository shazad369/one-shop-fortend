const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';

window.fetch = new Proxy(window.fetch, {
  apply: async function(target, thisArg, argumentsList) {
    let [input, init = {}] = argumentsList;

    // যদি relative path হয় (/ দিয়ে শুরু), backend URL জুড়ে দাও
    if (typeof input === 'string' && input.startsWith('/')) {
      input = BACKEND_URL + input;
    }

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
