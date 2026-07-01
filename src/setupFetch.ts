const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers || {});
  headers.set('localtonet-skip-warning', 'true');
  
  return originalFetch(input, { 
    ...init, 
    headers,
    mode: 'cors',
    credentials: 'omit'
  });
};
