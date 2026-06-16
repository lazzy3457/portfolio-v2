export const API_BASE = import.meta.env.VITE_API_BASE_URL
    ?? (import.meta.env.DEV
        ? "http://localhost/portfolio_v/v3/public/api"
        : "https://loic-merlhe.wstr.fr/api");
