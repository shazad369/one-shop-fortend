// src/setupFetch.ts - এইটুকুই যথেষ্ট
const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';
const API_KEY = 'one-shop-secret-key-change-this';

export async function getData(endpoint: string) {
    const url = endpoint.startsWith('/') ? `${BACKEND_URL}${endpoint}` : endpoint;
    const response = await fetch(url, {
        headers: { 'x-api-key': API_KEY }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export async function postData(endpoint: string, data: any) {
    const url = endpoint.startsWith('/') ? `${BACKEND_URL}${endpoint}` : endpoint;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}
