export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Modo simulado: login con usuarios de prueba, sin llamar a la API.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
