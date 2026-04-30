const API_BASE = '/api';

async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Note: Do NOT add 'Content-Type': 'application/json' here.
  // FormData in Step 8 will automatically set its own Content-Type.

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    // Attempt to parse error message from server
    let errorMessage = 'Request failed';
    try {
      const errorData = await res.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch (_) {
      // Fallback if body is not JSON
      errorMessage = res.statusText || 'API Error';
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export default apiClient;