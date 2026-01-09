// API client for Family Photo Archive

const API_BASE = '/api';

class API {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const suppressErrors = options.suppressErrors || false;
    
    const config = {
      credentials: 'include',
      headers: {},
      ...options,
    };

    // Only set Content-Type for non-FormData requests
    // Browser will set Content-Type with boundary for FormData
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Merge any additional headers
    if (options.headers) {
      Object.assign(config.headers, options.headers);
    }

    // Stringify JSON body
    if (config.body && typeof config.body === 'object' && !isFormData) {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    // Handle session expiration (401)
    if (response.status === 401) {
      // For expected 401s (like checking auth status), don't log console errors
      if (suppressErrors) {
        const error = new Error('Not authenticated');
        error.status = 401;
        throw error;
      }
      // Redirect to login for unexpected 401s
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      throw new Error('Session expired. Please login again.');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
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
    // Suppress errors for auth check - 401 is expected when not logged in
    return this.request('/auth/me', { suppressErrors: true });
  }

  // Libraries
  static async createLibrary(name) {
    return this.request('/libraries', {
      method: 'POST',
      body: { name },
    });
  }

  // Upload
  static async uploadPhotos(libraryId, files, onProgress = null) {
    if (!files || files.length === 0) {
      throw new Error('No files selected for upload');
    }

    const formData = new FormData();
    formData.append('library_id', libraryId);
    files.forEach(file => {
      formData.append('photos', file);
    });

    // Use fetch directly for upload progress tracking
    // Include library_id in query string because middleware needs it before multer processes FormData
    const url = `${API_BASE}/photos/upload?library_id=${libraryId}`;
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 401) {
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
          reject(new Error('Session expired. Please login again.'));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || error.message || `HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed: HTTP ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', url);
      xhr.withCredentials = true; // Include cookies
      xhr.send(formData);
    });
  }

  // Photos
  static async getTriageQueue(libraryId, limit = 50, offset = 0) {
    return this.request(`/photos/triage?library_id=${libraryId}&limit=${limit}&offset=${offset}`);
  }

  static async getMetadataQueue(libraryId, limit = 50, offset = 0) {
    return this.request(`/photos/metadata-entry?library_id=${libraryId}&limit=${limit}&offset=${offset}`);
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
    const body = { action };
    // Only include optional fields if they have values
    if (reason) body.reason = reason;
    if (duplicateOf) body.duplicate_of = duplicateOf;
    
    return this.request(`/photos/${id}/triage`, {
      method: 'POST',
      body,
    });
  }

  static async completePhoto(id) {
    console.log('API.completePhoto: Calling endpoint for photo', id);
    try {
      const result = await this.request(`/photos/${id}/complete`, { method: 'POST' });
      console.log('API.completePhoto: Success:', result);
      return result;
    } catch (error) {
      console.error('API.completePhoto: Error:', error);
      throw error;
    }
  }

  static async getRejectedQueue(libraryId, limit = 50, offset = 0) {
    return this.request(`/workflow/rejected?library_id=${libraryId}&limit=${limit}&offset=${offset}`);
  }

  static async undoDiscard(photoId) {
    return this.request(`/photos/${photoId}/undo-discard`, { method: 'POST' });
  }

  static async rotatePhoto(photoId, degrees, fileId = null) {
    const body = { degrees };
    if (fileId) body.file_id = fileId;
    return this.request(`/photos/${photoId}/rotate`, {
      method: 'POST',
      body,
    });
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
    // library_id is needed by requireLibraryMember middleware
    return this.request('/people', {
      method: 'POST',
      body: { library_id: libraryId, ...data },
    });
  }

  static async tagPhotoWithPerson(photoId, personId) {
    return this.request(`/photos/${photoId}/people/${personId}`, { method: 'POST' });
  }

  static async removePersonFromPhoto(photoId, personId) {
    return this.request(`/photos/${photoId}/people/${personId}`, { method: 'DELETE' });
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

  static async removeTagFromPhoto(photoId, tagId) {
    return this.request(`/photos/${photoId}/tags/${tagId}`, { method: 'DELETE' });
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

  static async addPhotoToAlbum(photoId, albumId) {
    return this.request(`/photos/${photoId}/albums/${albumId}`, { method: 'POST' });
  }

  static async removePhotoFromAlbum(photoId, albumId) {
    return this.request(`/photos/${photoId}/albums/${albumId}`, { method: 'DELETE' });
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
