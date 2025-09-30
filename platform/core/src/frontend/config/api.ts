/**
 * API Configuration
 */
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = isDev ? 'http://localhost:3000' : window.location.origin;