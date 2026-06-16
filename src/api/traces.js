import { API_BASE } from '../conf.jsx';

async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
    const data = await res.json();
    if (data?.error) throw new Error(data.message ?? data.error);
    return data;
}

export function fetchTraces(filters = {}, options = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) params.set(k, v);
    });
    const qs = params.toString();
    return fetchJson(`${API_BASE}/traces${qs ? `?${qs}` : ''}`, options);
}

export function fetchTrace(id, options = {}) {
    return fetchJson(`${API_BASE}/traces?id=${encodeURIComponent(id)}`, options);
}
