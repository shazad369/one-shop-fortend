// src/setupFetch.ts

const BACKEND_URL = 'https://surl.li/bzxoju';  // ✅ আপনার Localtonet URL
const API_KEY = 'one-shop-secret-key-change-this';

// ════════════════════════════════════════════════════════════
// 🔥 Common Headers (localtonet ওয়ার্নিং বাইপাস সহ)
// ════════════════════════════════════════════════════════════

const defaultHeaders = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
    'localtonet-skip-warning': 'true',  // ✅ লোকালটোনেট ওয়ার্নিং বাইপাস
};

// ════════════════════════════════════════════════════════════
// 🚀 GET Request
// ════════════════════════════════════════════════════════════

export async function getData(endpoint: string) {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log('📡 Fetching:', url);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: defaultHeaders,
            mode: 'cors',
            cache: 'no-cache',
        });
        
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Error response:', text);
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('❌ Fetch error:', error);
        throw error;
    }
}

// ════════════════════════════════════════════════════════════
// 🚀 POST Request
// ════════════════════════════════════════════════════════════

export async function postData(endpoint: string, data: any) {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log('📡 Posting to:', url);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(data),
            mode: 'cors',
            cache: 'no-cache',
        });
        
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Error response:', text);
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('❌ Post error:', error);
        throw error;
    }
}

// ════════════════════════════════════════════════════════════
// 🚀 PUT Request
// ════════════════════════════════════════════════════════════

export async function putData(endpoint: string, data: any) {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(data),
        mode: 'cors',
    });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    return response.json();
}

// ════════════════════════════════════════════════════════════
// 🚀 DELETE Request
// ════════════════════════════════════════════════════════════

export async function deleteData(endpoint: string) {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: defaultHeaders,
        mode: 'cors',
    });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    return response.json();
}
