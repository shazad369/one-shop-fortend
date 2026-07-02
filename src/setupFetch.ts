// src/setupFetch.ts - এই কোডটি ব্যবহার করুন
const BACKEND_URL = 'https://h9zgeyv2sm.localto.net';
const API_KEY = 'one-shop-secret-key-change-this';

export async function getData(endpoint: string) {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
            'x-api-key': API_KEY
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

// এখানে আর কিছু যোগ করবেন না!
