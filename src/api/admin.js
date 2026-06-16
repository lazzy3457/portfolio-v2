import { API_BASE } from '../conf.jsx';

function getToken() {
    return localStorage.getItem('admin_token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    };
}

async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
    }
    if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
    return res.json();
}

export function login(email, password) {
    return fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur de connexion');
        localStorage.setItem('admin_token', data.token);
        return data;
    });
}

export function logout() {
    localStorage.removeItem('admin_token');
}

export function isAuthenticated() {
    return !!getToken();
}

export function createTrace(data) {
    return fetchJson(`${API_BASE}/admin/traces`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function updateTrace(id, data) {
    return fetchJson(`${API_BASE}/admin/traces?id=${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function deleteTrace(id) {
    return fetchJson(`${API_BASE}/admin/traces?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}
