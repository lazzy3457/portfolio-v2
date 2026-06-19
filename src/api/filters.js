import { API_BASE } from '../conf.jsx';

const _cache = new Map();

function fetchCached(url) {
    if (!_cache.has(url)) {
        const promise = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
                return res.json();
            })
            .catch(err => {
                _cache.delete(url);
                throw err;
            });
        _cache.set(url, promise);
    }
    return _cache.get(url);
}

export const fetchLanguages    = () => fetchCached(`${API_BASE}/languages`);
export const fetchSkills       = () => fetchCached(`${API_BASE}/skills`);
export const fetchProjectTypes = () => fetchCached(`${API_BASE}/project-types`);
export const fetchContexts     = () => fetchCached(`${API_BASE}/contexts`);
export const fetchAcs          = () => fetchCached(`${API_BASE}/acs`);
