// src/setupFetch.ts
// ✅ আপনার আসল ব্যাকএন্ড URL ব্যবহার করুন
const BACKEND_URL = 'https://oneshop.pre.bd';  // ← এইটা পরিবর্তন করুন
const API_KEY = 'one-shop-secret-key-change-this';

export async function getData(endpoint: string) {
    const url = `${BACKEND_URL}${endpoint}`;
    const response = await fetch(url, {
        headers: { 'x-api-key': API_KEY }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}
