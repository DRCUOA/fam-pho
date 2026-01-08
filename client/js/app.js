// Main application entry point

import API from './api.js';
import { renderLogin, renderDashboard, renderUpload, renderTriage, renderMetadata, renderSearch } from './views.js';

let currentUser = null;
let currentLibrary = null;

// Initialize app
async function init() {
  try {
    const data = await API.getCurrentUser();
    currentUser = data.user;
    currentLibrary = data.libraries && data.libraries[0] ? data.libraries[0] : null;
    
    if (currentLibrary) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();
  }
}

// Navigation
function showLogin() {
  document.getElementById('app').innerHTML = renderLogin();
  setupLoginHandlers();
}

function showDashboard() {
  document.getElementById('app').innerHTML = renderDashboard(currentUser, currentLibrary);
  setupDashboardHandlers();
}

function showUpload() {
  document.getElementById('app').innerHTML = renderUpload(currentLibrary);
  setupUploadHandlers();
}

function showTriage() {
  document.getElementById('app').innerHTML = renderTriage(currentLibrary);
  setupTriageHandlers();
}

function showMetadata(photoId) {
  document.getElementById('app').innerHTML = renderMetadata(photoId, currentLibrary);
  setupMetadataHandlers(photoId);
}

function showSearch() {
  document.getElementById('app').innerHTML = renderSearch(currentLibrary);
  setupSearchHandlers();
}

// Login handlers
function setupLoginHandlers() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        await API.login(email, password);
        await init();
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  }
}

// Dashboard handlers
function setupDashboardHandlers() {
  const uploadBtn = document.getElementById('btn-upload');
  const triageBtn = document.getElementById('btn-triage');
  const searchBtn = document.getElementById('btn-search');
  const logoutBtn = document.getElementById('btn-logout');

  if (uploadBtn) uploadBtn.addEventListener('click', () => showUpload());
  if (triageBtn) triageBtn.addEventListener('click', () => showTriage());
  if (searchBtn) searchBtn.addEventListener('click', () => showSearch());
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await API.logout();
      showLogin();
    });
  }

  // Load next tasks
  loadNextTasks();
}

async function loadNextTasks() {
  try {
    const tasks = await API.getNextTasks(currentLibrary.id);
    updateTaskCounts(tasks.queues);
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
}

function updateTaskCounts(queues) {
  const triageCount = document.getElementById('triage-count');
  const metadataCount = document.getElementById('metadata-count');
  
  if (triageCount) triageCount.textContent = queues.triage.count || 0;
  if (metadataCount) metadataCount.textContent = queues.metadata_entry.count || 0;
}

// Upload handlers
function setupUploadHandlers() {
  const backBtn = document.getElementById('btn-back');
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('btn-upload-files');

  if (backBtn) backBtn.addEventListener('click', () => showDashboard());

  // Drag and drop
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    uploadZone.addEventListener('click', () => {
      fileInput?.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      fileInput?.click();
    });
  }
}

async function handleFiles(files) {
  if (files.length === 0) return;

  const fileList = document.getElementById('file-list');
  const uploadStatus = document.getElementById('upload-status');

  // Show file list
  Array.from(files).forEach(file => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-2 bg-white rounded';
    item.innerHTML = `
      <span>${file.name}</span>
      <span class="text-sm text-neutral-500">${formatFileSize(file.size)}</span>
    `;
    fileList?.appendChild(item);
  });

  // Upload files
  if (uploadStatus) {
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.className = 'text-blue-600';
  }

  try {
    const result = await API.uploadPhotos(currentLibrary.id, Array.from(files));
    
    if (uploadStatus) {
      uploadStatus.textContent = `Uploaded: ${result.uploaded}, Duplicates: ${result.duplicates}, Errors: ${result.errors}`;
      uploadStatus.className = 'text-green-600';
    }

    setTimeout(() => {
      showDashboard();
    }, 2000);
  } catch (error) {
    if (uploadStatus) {
      uploadStatus.textContent = 'Upload failed: ' + error.message;
      uploadStatus.className = 'text-red-600';
    }
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Triage handlers
function setupTriageHandlers() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.addEventListener('click', () => showDashboard());

  loadTriageQueue();
}

async function loadTriageQueue() {
  try {
    const data = await API.getTriageQueue(currentLibrary.id);
    renderTriagePhotos(data.photos);
  } catch (error) {
    console.error('Failed to load triage queue:', error);
  }
}

function renderTriagePhotos(photos) {
  const container = document.getElementById('triage-photos');
  if (!container || photos.length === 0) {
    if (container) container.innerHTML = '<p class="text-neutral-500">No photos in triage queue</p>';
    return;
  }

  const photo = photos[0];
  const thumbnail = photo.files?.find(f => f.kind === 'thumbnail');
  
  container.innerHTML = `
    <div class="mb-4">
      <p class="text-sm text-neutral-600">Photo 1 of ${photos.length}</p>
    </div>
    <div class="mb-6">
      <img src="${thumbnail ? API.getFileUrl(thumbnail.id) : ''}" 
           alt="Photo preview" 
           class="w-full max-h-96 object-contain bg-neutral-200 rounded-lg">
    </div>
    <div class="flex gap-4">
      <button onclick="triageAction(${photo.id}, 'keep')" 
              class="flex-1 bg-green-600 text-white py-3 rounded-lg">
        Keep
      </button>
      <button onclick="triageAction(${photo.id}, 'discard')" 
              class="flex-1 bg-red-600 text-white py-3 rounded-lg">
        Discard
      </button>
      <button onclick="triageAction(${photo.id}, 'duplicate')" 
              class="flex-1 bg-yellow-600 text-white py-3 rounded-lg">
        Duplicate
      </button>
    </div>
  `;
}

window.triageAction = async function(photoId, action) {
  try {
    await API.triagePhoto(photoId, action);
    loadTriageQueue();
  } catch (error) {
    alert('Failed to process: ' + error.message);
  }
};

// Metadata handlers
function setupMetadataHandlers(photoId) {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.addEventListener('click', () => showTriage());

  loadPhotoMetadata(photoId);
}

async function loadPhotoMetadata(photoId) {
  try {
    const data = await API.getPhoto(photoId);
    renderMetadataForm(data.photo);
  } catch (error) {
    console.error('Failed to load photo:', error);
  }
}

function renderMetadataForm(photo) {
  const form = document.getElementById('metadata-form');
  if (!form) return;

  form.innerHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Date Taken</label>
      <input type="date" id="date-taken" value="${photo.date_taken ? photo.date_taken.split('T')[0] : ''}" 
             class="w-full p-2 border rounded">
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Location</label>
      <input type="text" id="location" value="${photo.location_text || ''}" 
             class="w-full p-2 border rounded">
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Description</label>
      <textarea id="description" rows="4" 
                class="w-full p-2 border rounded">${photo.description || ''}</textarea>
    </div>
    <button onclick="saveMetadata(${photo.id})" 
            class="w-full bg-neutral-900 text-white py-3 rounded-lg">
      Save & Continue
    </button>
  `;
}

window.saveMetadata = async function(photoId) {
  try {
    const data = {
      date_taken: document.getElementById('date-taken').value,
      location_text: document.getElementById('location').value,
      description: document.getElementById('description').value,
    };
    await API.updatePhoto(photoId, data);
    await API.completePhoto(photoId);
    showTriage();
  } catch (error) {
    alert('Failed to save: ' + error.message);
  }
};

// Search handlers
function setupSearchHandlers() {
  const backBtn = document.getElementById('btn-back');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('btn-search-submit');

  if (backBtn) backBtn.addEventListener('click', () => showDashboard());
  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
}

async function performSearch() {
  const query = document.getElementById('search-input')?.value || '';
  try {
    const data = await API.searchPhotos(currentLibrary.id, { q: query });
    renderSearchResults(data.photos);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

function renderSearchResults(photos) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (photos.length === 0) {
    container.innerHTML = '<p class="text-neutral-500">No photos found</p>';
    return;
  }

  container.innerHTML = photos.map(photo => {
    const thumbnail = photo.thumbnail;
    return `
      <div class="bg-white rounded-lg overflow-hidden cursor-pointer" onclick="showPhotoDetail(${photo.id})">
        ${thumbnail ? `<img src="${thumbnail.url}" alt="Photo" class="w-full h-48 object-cover">` : ''}
        <div class="p-2">
          <p class="text-sm text-neutral-600">${photo.date_taken ? new Date(photo.date_taken).toLocaleDateString() : 'No date'}</p>
        </div>
      </div>
    `;
  }).join('');
}

window.showPhotoDetail = function(photoId) {
  showMetadata(photoId);
};

// Export navigation functions
window.showDashboard = showDashboard;
window.showUpload = showUpload;
window.showTriage = showTriage;
window.showSearch = showSearch;

// Initialize on load
init();
