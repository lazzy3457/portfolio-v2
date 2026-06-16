import { API_BASE } from '../conf.jsx';

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
    return res.json();
}

export const fetchLanguages    = () => fetchJson(`${API_BASE}/languages`);
export const fetchSkills       = () => fetchJson(`${API_BASE}/skills`);
export const fetchProjectTypes = () => fetchJson(`${API_BASE}/project-types`);
export const fetchContexts     = () => fetchJson(`${API_BASE}/contexts`);
