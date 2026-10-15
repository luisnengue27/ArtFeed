
const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint, options = {}) {
    const token =
        localStorage.getItem("tokenCliente") ||
        localStorage.getItem("token");

    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
}
