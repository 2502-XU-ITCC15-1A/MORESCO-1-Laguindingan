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
    } catch {
      errorMessage = res.statusText || 'API Error';
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export default apiClient;

export const authAPI = {
  login: (username, password) =>
    apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const patientsAPI = {
  getAll: () => apiClient('/patients'),
  getOne: (id) => apiClient(`/patients/${id}`),
  create: (formData) => apiClient('/patients', { method: 'POST', body: formData }),
  update: (id, formData) => apiClient(`/patients/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => apiClient(`/patients/${id}`, { method: 'DELETE' }),
};

export const recordsAPI = {
  getAll: (patientId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiClient(`/records/${patientId}${params ? `?${params}` : ''}`);
  },
  create: (patientId, formData) => apiClient(`/records/${patientId}`, { method: 'POST', body: formData }),
  update: (recordId, formData) => apiClient(`/records/${recordId}`, { method: 'PUT', body: formData }),
  delete: (recordId) => apiClient(`/records/${recordId}`, { method: 'DELETE' }),
  getDiseaseStats: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiClient(`/records/stats/diseases${params ? `?${params}` : ''}`);
  },
};

export const diseasesAPI = {
  getAll: () => apiClient('/diseases'),
  create: (data) => apiClient('/diseases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiClient(`/diseases/${id}`, { method: 'DELETE' }),
};
