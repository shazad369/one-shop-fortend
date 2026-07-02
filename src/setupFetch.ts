const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';

// ============================================
// ✅ সঠিক ফ্রন্টেন্ড কোড - CORS error থাকবে না
// ============================================

const BACKEND_URL = 'https://oneshop.pre.bd';
const API_KEY = 'one-shop-secret-key-change-this';

// 1️⃣ সরাসরি fetch - কোনো ওভাররাইড নেই
// এই কোডটি আপনার পুরো fetch ওভাররাইড কোডের জায়গায় বসবে

// 2️⃣ API হেল্পার ফাংশন (যা fetch ওভাররাইডের কাজ করবে)
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('/') ? `${BACKEND_URL}${endpoint}` : endpoint;
    
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

    return response.json();
}

// 3️⃣ ব্যবহারের উদাহরণ:

// GET রিকোয়েস্ট
async function getData(endpoint) {
    return apiRequest(endpoint);
}

// POST রিকোয়েস্ট
async function postData(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// 4️⃣ আপনার পুরানো কোড যেখানে fetch ব্যবহার করতেন:

// ❌ আগে (যা CORS error দিচ্ছিল):
// const data = await fetch('/shopdata?page=1&limit=20');

// ✅ এখন (CORS error থাকবে না):
const data = await getData('/shopdata?page=1&limit=20');

// অথবা সরাসরি:
const data = await apiRequest('/shopdata?page=1&limit=20');
