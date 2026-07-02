// src/setupFetch.ts
const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';  // ✅ আপনার ব্যাকএন্ড URL
const API_KEY = 'one-shop-secret-key-change-this';

export async function getData(endpoint: string) {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log('📡 Fetching:', url);
    
    const response = await fetch(url, {
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        const text = await response.text();
        console.error('❌ Error response:', text);
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    return response.json();
}

export async function postData(endpoint: string, data: any) {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
}
