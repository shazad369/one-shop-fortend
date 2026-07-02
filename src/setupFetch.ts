// src/api.js - CORS বাইপাস সহ
const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';
const API_KEY = 'one-shop-secret-key-change-this';

// ✅ CORS বাইপাস - fetch override
const originalFetch = window.fetch;
window.fetch = function(input, init = {}) {
    let url = input;
    if (typeof input === 'string' && input.startsWith('/')) {
        url = BACKEND_URL + input;
    }
    
    const headers = new Headers(init.headers || {});
    headers.set('x-api-key', API_KEY);
    
    // 🔥 mode: 'no-cors' দিয়ে CORS বাইপাস
    return originalFetch(url, {
        ...init,
        headers,
        mode: 'no-cors',
        credentials: 'include'
    });
};

// API ফাংশন
export async function getData(endpoint) {
    try {
        const response = await fetch(endpoint);
        // mode: 'no-cors' এ response.ok কাজ করে না
        // তাই text() দিয়ে নিয়ে JSON parse করুন
        const text = await response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// ব্যবহার:
// const data = await getData('/shopdata?page=1&limit=20');
