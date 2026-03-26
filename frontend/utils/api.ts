const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    return res.json();
  }

  get(path: string) { return this.request(path); }
  post(path: string, body?: any) { return this.request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }
  put(path: string, body?: any) { return this.request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }); }
  del(path: string) { return this.request(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
export default api;
