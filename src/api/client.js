const API_BASE = '/api';

async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  // Start with user-provided headers
  const headers = {
    ...options.headers,
  };

  // Add Authorization if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // ✅ CRITICAL FIX: Set Content-Type for JSON requests only
  // If body is FormData, let the browser set the correct multipart header
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await res.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch (_) {
      errorMessage = res.statusText || 'API Error';
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export default apiClient;