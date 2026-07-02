// src/setupFetch.ts
// ============================================
// ✅ ফিক্স করা কোড - CORS error থাকবে না
// ============================================

const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';
const API_KEY = 'one-shop-secret-key-change-this';

// API হেল্পার ফাংশন
async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('/') ? `${BACKEND_URL}${endpoint}` : endpoint;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
}

// GET রিকোয়েস্ট
async function getData(endpoint: string) {
    return apiRequest(endpoint);
}

// POST রিকোয়েস্ট
async function postData(endpoint: string, data: any) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ============================================
// ✅ ব্যবহার - async function এর ভিতরে
// ============================================

// DOM লোড হলে রান করবে
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const products = await getData('/shopdata?page=1&limit=20');
        console.log('✅ প্রোডাক্ট:', products);
    } catch (error) {
        console.error('❌ Error:', error);
    }
});

// অথবা IIFE (এখনই রান করবে)
(async function init() {
    try {
        const categories = await getData('/shopdata/categories');
        console.log('✅ ক্যাটেগরি:', categories);
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();

// ============================================
// 📤 Export (যদি অন্য ফাইল থেকে ব্যবহার করেন)
// ============================================

export { apiRequest, getData, postData };
