// API client for Family Photo Archive

const API_BASE = '/api';

class API {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  static async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  static async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  static async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Upload
  static async uploadPhotos(libraryId, files) {
    const formData = new FormData();
    formData.append('library_id', libraryId);
    files.forEach(file => {
      formData.append('photos', file);
    });

    return this.request('/photos/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Photos
  static async getTriageQueue(libraryId, limit = 50, offset = 0) {
    return this.request(`/photos/triage?library_id=${libraryId}&limit=${limit}&offset=${offset}`);
  }

  static async getPhoto(id) {
    return this.request(`/photos/${id}`);
  }

  static async updatePhoto(id, data) {
    return this.request(`/photos/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async triagePhoto(id, action, reason = null, duplicateOf = null) {
    return this.request(`/photos/${id}/triage`, {
      method: 'POST',
      body: { action, reason, duplicate_of: duplicateOf },
    });
  }

  static async completePhoto(id) {
    return this.request(`/photos/${id}/complete`, { method: 'POST' });
  }

  // Search
  static async searchPhotos(libraryId, params = {}) {
    const query = new URLSearchParams({ library_id: libraryId, ...params });
    return this.request(`/photos/search?${query}`);
  }

  // People
  static async getPeople(libraryId) {
    return this.request(`/people?library_id=${libraryId}`);
  }

  static async createPerson(libraryId, data) {
    return this.request('/people', {
      method: 'POST',
      body: { library_id: libraryId, ...data },
    });
  }

  static async tagPhotoWithPerson(photoId, personId) {
    return this.request(`/photos/${photoId}/people/${personId}`, { method: 'POST' });
  }

  // Tags
  static async getTags(libraryId) {
    return this.request(`/tags?library_id=${libraryId}`);
  }

  static async addTagToPhoto(photoId, tagName) {
    return this.request(`/photos/${photoId}/tags`, {
      method: 'POST',
      body: { name: tagName },
    });
  }

  // Albums
  static async getAlbums(libraryId) {
    return this.request(`/albums?library_id=${libraryId}`);
  }

  static async createAlbum(libraryId, data) {
    return this.request('/albums', {
      method: 'POST',
      body: { library_id: libraryId, ...data },
    });
  }

  // Workflow
  static async getNextTasks(libraryId) {
    return this.request(`/workflow/next-tasks?library_id=${libraryId}`);
  }

  // Files
  static getFileUrl(fileId) {
    return `${API_BASE}/files/${fileId}`;
  }
}

export default API;
