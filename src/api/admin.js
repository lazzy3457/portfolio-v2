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
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur réseau (${res.status})`);
    }
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

export function createLanguage(data) {
    return fetchJson(`${API_BASE}/admin/languages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function updateLanguage(id, data) {
    return fetchJson(`${API_BASE}/admin/languages?id=${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function deleteLanguage(id) {
    return fetchJson(`${API_BASE}/admin/languages?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}

export function createSkill(data) {
    return fetchJson(`${API_BASE}/admin/skills`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function updateSkill(id, data) {
    return fetchJson(`${API_BASE}/admin/skills?id=${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function deleteSkill(id) {
    return fetchJson(`${API_BASE}/admin/skills?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}

export function createProjectType(data) {
    return fetchJson(`${API_BASE}/admin/project-types`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function updateProjectType(id, data) {
    return fetchJson(`${API_BASE}/admin/project-types?id=${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function deleteProjectType(id) {
    return fetchJson(`${API_BASE}/admin/project-types?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}

export function createAc(data) {
    return fetchJson(`${API_BASE}/admin/acs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function updateAc(id, data) {
    return fetchJson(`${API_BASE}/admin/acs?id=${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
}

export function deleteAc(id) {
    return fetchJson(`${API_BASE}/admin/acs?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}

export function uploadTraceImage(traceId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson(`${API_BASE}/admin/traces/${traceId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData,
    });
}
