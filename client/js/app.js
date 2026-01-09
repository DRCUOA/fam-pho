// Main application entry point

import API from './api.js';
import { renderLogin, renderDashboard, renderUpload, renderTriage, renderMetadata, renderSearch } from './views.js';

let currentUser = null;
let currentLibrary = null;

// Utility functions for notifications and loading states
function showLoading(message = 'Loading...') {
  // Remove existing notifications
  removeNotifications();
  
  const notification = document.createElement('div');
  notification.id = 'app-loading';
  notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px]';
  notification.innerHTML = `
    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    <span>${escapeHtml(message)}</span>
  `;
  document.body.appendChild(notification);
}

function hideLoading() {
  const loading = document.getElementById('app-loading');
  if (loading) loading.remove();
}

function showError(message, duration = 5000) {
  removeNotifications();
  
  const notification = document.createElement('div');
  notification.id = 'app-error';
  notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px] max-w-[90%]';
  notification.innerHTML = `
    <i class="fa-solid fa-exclamation-circle"></i>
    <span class="flex-1">${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 hover:opacity-75">
      <i class="fa-solid fa-times"></i>
    </button>
  `;
  document.body.appendChild(notification);
  
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentElement) notification.remove();
    }, duration);
  }
}

function showSuccess(message, duration = 3000) {
  removeNotifications();
  
  const notification = document.createElement('div');
  notification.id = 'app-success';
  notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px]';
  notification.innerHTML = `
    <i class="fa-solid fa-check-circle"></i>
    <span>${escapeHtml(message)}</span>
  `;
  document.body.appendChild(notification);
  
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentElement) notification.remove();
    }, duration);
  }
}

function removeNotifications() {
  const loading = document.getElementById('app-loading');
  const error = document.getElementById('app-error');
  const success = document.getElementById('app-success');
  if (loading) loading.remove();
  if (error) error.remove();
  if (success) success.remove();
}

// Make utilities available globally
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showSuccess = showSuccess;

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
    // Session expired or not logged in
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
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        showError('Please enter both email and password');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
      }

      try {
        await API.login(email, password);
        await init();
      } catch (error) {
        showError('Login failed: ' + error.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Login';
        }
      }
    });
  }
}

// Dashboard handlers
function setupDashboardHandlers() {
  const uploadBtn = document.getElementById('btn-upload');
  const triageBtn = document.getElementById('btn-triage');
  const metadataBtn = document.getElementById('btn-metadata');
  const searchBtn = document.getElementById('btn-search');
  const logoutBtn = document.getElementById('btn-logout');

  if (uploadBtn) uploadBtn.addEventListener('click', () => showUpload());
  if (triageBtn) triageBtn.addEventListener('click', () => showTriage());
  if (metadataBtn) metadataBtn.addEventListener('click', () => {
    // Load first photo in metadata_entry state
    loadNextTasks().then(() => {
      const metadataBtn2 = document.getElementById('btn-next-metadata');
      if (metadataBtn2) metadataBtn2.click();
    });
  });
  if (searchBtn) searchBtn.addEventListener('click', () => showSearch());
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await API.logout();
        showLogin();
      } catch (error) {
        showError('Logout failed: ' + error.message);
      }
    });
  }

  // Load next tasks
  loadNextTasks();
}

async function loadNextTasks() {
  try {
    const tasks = await API.getNextTasks(currentLibrary.id);
    updateTaskCounts(tasks.queues);
    updateWorkflowStatus(tasks.queues);
    renderNextTasks(tasks.queues);
  } catch (error) {
    console.error('Failed to load tasks:', error);
    showError('Failed to load tasks: ' + error.message);
  }
}

function updateTaskCounts(queues) {
  const triageCount = document.getElementById('triage-count');
  const metadataCount = document.getElementById('metadata-count');
  
  if (triageCount) triageCount.textContent = queues.triage?.count || 0;
  if (metadataCount) metadataCount.textContent = queues.metadata_entry?.count || 0;
}

function updateWorkflowStatus(queues) {
  const stageEl = document.getElementById('workflow-stage');
  const iconEl = document.getElementById('workflow-icon');
  const progressBar = document.getElementById('workflow-progress-bar');
  const progressPercent = document.getElementById('workflow-percent');

  const triageCount = queues.triage?.count || 0;
  const metadataCount = queues.metadata_entry?.count || 0;
  const flaggedCount = queues.flagged?.count || 0;
  const totalPending = triageCount + metadataCount + flaggedCount;

  // Determine current stage
  let stage = 'All caught up!';
  let icon = 'fa-check-circle';
  let color = 'green';

  if (triageCount > 0) {
    stage = `${triageCount} photo${triageCount !== 1 ? 's' : ''} in review queue`;
    icon = 'fa-list-check';
    color = 'blue';
  } else if (metadataCount > 0) {
    stage = `${metadataCount} photo${metadataCount !== 1 ? 's' : ''} need metadata`;
    icon = 'fa-tags';
    color = 'yellow';
  } else if (flaggedCount > 0) {
    stage = `${flaggedCount} photo${flaggedCount !== 1 ? 's' : ''} flagged`;
    icon = 'fa-flag';
    color = 'orange';
  } else {
    stage = 'Ready to upload';
    icon = 'fa-cloud-arrow-up';
    color = 'blue';
  }

  if (stageEl) stageEl.textContent = stage;
  if (iconEl) {
    iconEl.className = `fa-solid ${icon} text-white`;
    const statusDiv = iconEl.closest('.bg-blue-600, .bg-green-600, .bg-yellow-600, .bg-orange-600');
    if (statusDiv) {
      // Remove all color classes and add the correct one
      statusDiv.className = statusDiv.className
        .replace(/bg-(blue|green|yellow|orange)-600/g, '')
        .trim();
      const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        yellow: 'bg-yellow-600',
        orange: 'bg-orange-600',
      };
      statusDiv.className = `w-10 h-10 ${colorClasses[color] || 'bg-blue-600'} rounded-full flex items-center justify-center mr-3`;
    }
  }

  // Calculate progress (simplified - assume 100 photos = 100%)
  const progress = totalPending > 0 ? Math.min(100, (totalPending / 100) * 100) : 0;
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
}

function renderNextTasks(queues) {
  const container = document.getElementById('next-tasks');
  if (!container) return;

  const tasks = [];
  
  if (queues.triage?.count > 0) {
    tasks.push({
      icon: 'fa-list-check',
      color: 'blue',
      title: 'Review Queue',
      count: queues.triage.count,
      action: () => showTriage(),
    });
  }

  if (queues.metadata_entry?.count > 0) {
    tasks.push({
      icon: 'fa-tags',
      color: 'yellow',
      title: 'Metadata Entry',
      count: queues.metadata_entry.count,
      action: () => {
        if (queues.metadata_entry.photos && queues.metadata_entry.photos.length > 0) {
          showMetadata(queues.metadata_entry.photos[0].id);
        }
      },
    });
  }

  if (queues.flagged?.count > 0) {
    tasks.push({
      icon: 'fa-flag',
      color: 'orange',
      title: 'Flagged Photos',
      count: queues.flagged.count,
      action: () => showSearch(), // Could be a separate flagged view
    });
  }

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <i class="fa-solid fa-check-circle text-3xl text-green-500 mb-2"></i>
        <p class="text-neutral-600">All tasks complete!</p>
      </div>
    `;
    return;
  }

  const colorMap = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  };

  container.innerHTML = tasks.map((task, index) => {
    const colors = colorMap[task.color] || colorMap.blue;
    return `
      <button onclick="window.dashboardTaskAction${index}()" 
              class="w-full bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex items-center justify-between min-h-[60px] transition-colors">
        <div class="flex items-center flex-1">
          <div class="w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center mr-3">
            <i class="fa-solid ${task.icon} ${colors.text}"></i>
          </div>
          <div class="text-left flex-1">
            <div class="text-base text-neutral-900 font-medium">${escapeHtml(task.title)}</div>
            <div class="text-sm text-neutral-500">${task.count} photo${task.count !== 1 ? 's' : ''} waiting</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-neutral-400"></i>
      </button>
    `;
  }).join('');

  // Create action handlers
  tasks.forEach((task, index) => {
    window[`dashboardTaskAction${index}`] = task.action;
  });
}

// Upload handlers
let selectedFiles = [];

function setupUploadHandlers() {
  const backBtn = document.getElementById('btn-back');
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-input');
  const uploadBtn = document.getElementById('btn-upload-files');
  const cameraBtn = document.getElementById('btn-camera-capture');
  const uploadStartBtn = document.getElementById('btn-upload-start');
  const clearBtn = document.getElementById('btn-clear-files');

  if (backBtn) backBtn.addEventListener('click', () => showDashboard());

  // Drag and drop
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });
  }

  if (cameraBtn) {
    cameraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cameraInput?.click();
    });
  }

  if (uploadStartBtn) {
    uploadStartBtn.addEventListener('click', () => {
      uploadSelectedFiles();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearFileSelection();
    });
  }
}

function handleFiles(files) {
  if (files.length === 0) return;

  const fileArray = Array.from(files);
  selectedFiles = [...selectedFiles, ...fileArray];
  renderFilePreviews();
  showUploadActions();
}

function renderFilePreviews() {
  const container = document.getElementById('file-preview-list');
  if (!container) return;

  if (selectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = selectedFiles.map((file, index) => {
    const preview = URL.createObjectURL(file);
    return `
      <div class="bg-white rounded-lg p-3 border border-neutral-200 flex items-center gap-3" data-file-index="${index}">
        <div class="w-16 h-16 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
          <img src="${preview}" alt="${file.name}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-neutral-900 truncate">${escapeHtml(file.name)}</p>
          <p class="text-xs text-neutral-500">${formatFileSize(file.size)}</p>
        </div>
        <button onclick="removeFile(${index})" 
                class="p-2 text-red-600 hover:bg-red-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;
  }).join('');
}

window.removeFile = function(index) {
  selectedFiles.splice(index, 1);
  renderFilePreviews();
  if (selectedFiles.length === 0) {
    hideUploadActions();
  }
};

function showUploadActions() {
  const actionsDiv = document.getElementById('upload-actions');
  if (actionsDiv) {
    actionsDiv.classList.remove('hidden');
  }
}

function hideUploadActions() {
  const actionsDiv = document.getElementById('upload-actions');
  if (actionsDiv) {
    actionsDiv.classList.add('hidden');
  }
}

function clearFileSelection() {
  selectedFiles = [];
  renderFilePreviews();
  hideUploadActions();
  const statusDiv = document.getElementById('upload-status');
  if (statusDiv) {
    statusDiv.textContent = '';
    statusDiv.className = 'text-sm';
  }
}

async function uploadSelectedFiles() {
  if (selectedFiles.length === 0) return;

  const uploadStatus = document.getElementById('upload-status');
  const progressDiv = document.getElementById('upload-progress');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const uploadStartBtn = document.getElementById('btn-upload-start');

  // Show progress
  if (progressDiv) progressDiv.classList.remove('hidden');
  if (uploadStartBtn) uploadStartBtn.disabled = true;
  if (uploadStartBtn) uploadStartBtn.classList.add('opacity-50', 'cursor-not-allowed');

  // Update progress
  const updateProgress = (percent) => {
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `Uploading... ${Math.round(percent)}%`;
  };

  try {
    const result = await API.uploadPhotos(currentLibrary.id, selectedFiles, updateProgress);
    
    // Hide progress
    if (progressDiv) progressDiv.classList.add('hidden');
    
    // Show success message
    if (uploadStatus) {
      const uploaded = result.uploaded || 0;
      const duplicates = result.duplicates || 0;
      const errors = result.errors || 0;
      
      let message = `Successfully uploaded ${uploaded} photo${uploaded !== 1 ? 's' : ''}`;
      if (duplicates > 0) {
        message += `, ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped`;
      }
      if (errors > 0) {
        message += `, ${errors} error${errors !== 1 ? 's' : ''}`;
      }
      
      uploadStatus.textContent = message;
      uploadStatus.className = 'text-sm text-green-600 font-medium';
    }

    // Clear selection
    selectedFiles = [];
    renderFilePreviews();
    hideUploadActions();

    // Redirect to triage after delay
    setTimeout(() => {
      showTriage();
    }, 2000);
  } catch (error) {
    // Hide progress
    if (progressDiv) progressDiv.classList.add('hidden');
    
    if (uploadStatus) {
      uploadStatus.textContent = 'Upload failed: ' + error.message;
      uploadStatus.className = 'text-sm text-red-600 font-medium';
    }
    
    if (uploadStartBtn) uploadStartBtn.disabled = false;
    if (uploadStartBtn) uploadStartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Triage handlers
let triagePhotos = [];
let currentTriageIndex = 0;
let isGridView = false;

function setupTriageHandlers() {
  const backBtn = document.getElementById('btn-back');
  const gridViewBtn = document.getElementById('btn-grid-view');
  
  if (backBtn) backBtn.addEventListener('click', () => showDashboard());
  
  if (gridViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      isGridView = !isGridView;
      renderTriageView();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleTriageKeyboard);

  loadTriageQueue();
}

function handleTriageKeyboard(e) {
  // Only handle if we're on triage view and not in an input
  if (document.getElementById('triage-photos')?.classList.contains('hidden')) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'ArrowLeft' && currentTriageIndex > 0) {
    e.preventDefault();
    currentTriageIndex--;
    renderTriagePhoto();
  } else if (e.key === 'ArrowRight' && currentTriageIndex < triagePhotos.length - 1) {
    e.preventDefault();
    currentTriageIndex++;
    renderTriagePhoto();
  } else if (e.key === 'k' || e.key === 'K') {
    e.preventDefault();
    triageAction(triagePhotos[currentTriageIndex]?.id, 'keep');
  } else if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    triageAction(triagePhotos[currentTriageIndex]?.id, 'discard');
  } else if (e.key === 'u' || e.key === 'U') {
    e.preventDefault();
    triageAction(triagePhotos[currentTriageIndex]?.id, 'duplicate');
  }
}

async function loadTriageQueue() {
  const loadingDiv = document.getElementById('triage-loading');
  const container = document.getElementById('triage-photos');
  const emptyDiv = document.getElementById('triage-empty');
  const gridDiv = document.getElementById('triage-grid');

  if (loadingDiv) loadingDiv.classList.remove('hidden');
  if (container) container.classList.add('hidden');
  if (emptyDiv) emptyDiv.classList.add('hidden');
  if (gridDiv) gridDiv.classList.add('hidden');

  try {
    const data = await API.getTriageQueue(currentLibrary.id);
    triagePhotos = data.photos || [];
    currentTriageIndex = 0;
    
    if (loadingDiv) loadingDiv.classList.add('hidden');
    
    if (triagePhotos.length === 0) {
      if (emptyDiv) emptyDiv.classList.remove('hidden');
    } else {
      renderTriageView();
    }
  } catch (error) {
    console.error('Failed to load triage queue:', error);
    if (loadingDiv) loadingDiv.classList.add('hidden');
    showError('Failed to load triage queue: ' + error.message);
  }
}

function renderTriageView() {
  if (isGridView) {
    renderTriageGrid();
  } else {
    renderTriagePhoto();
  }
}

function renderTriagePhoto() {
  const container = document.getElementById('triage-photos');
  const gridDiv = document.getElementById('triage-grid');
  
  if (!container || triagePhotos.length === 0) return;

  if (gridDiv) gridDiv.classList.add('hidden');
  container.classList.remove('hidden');

  const photo = triagePhotos[currentTriageIndex];
  if (!photo) return;

  const thumbnail = photo.files?.find(f => f.kind === 'thumbnail') || 
                    photo.files?.find(f => f.kind === 'master');
  const master = photo.files?.find(f => f.kind === 'master');
  
  const uploadDate = photo.upload_at ? new Date(photo.upload_at).toLocaleDateString() : 'Unknown';
  const fileName = photo.original_filename || 'Unknown';
  
  container.innerHTML = `
    <div class="mb-4 flex items-center justify-between">
      <p class="text-sm text-neutral-600">
        Photo ${currentTriageIndex + 1} of ${triagePhotos.length}
      </p>
      <div class="flex gap-2">
        <button onclick="skipPhoto()" 
                class="px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded min-h-[32px]">
          Skip
        </button>
      </div>
    </div>
    
    <div class="mb-4 bg-white rounded-lg p-3 border border-neutral-200">
      <p class="text-xs text-neutral-500 mb-1">Filename</p>
      <p class="text-sm text-neutral-900 font-medium truncate">${escapeHtml(fileName)}</p>
      <p class="text-xs text-neutral-500 mt-2">Uploaded: ${uploadDate}</p>
    </div>
    
    <div class="mb-6 bg-neutral-100 rounded-lg overflow-hidden">
      <img src="${thumbnail ? API.getFileUrl(thumbnail.id) : ''}" 
           alt="Photo preview" 
           class="w-full max-h-[60vh] object-contain"
           id="triage-photo-img"
           loading="lazy">
    </div>
    
    <div class="space-y-3">
      <button onclick="triageAction(${photo.id}, 'keep')" 
              class="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-medium min-h-[44px] flex items-center justify-center gap-2">
        <i class="fa-solid fa-check"></i>
        Keep
      </button>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="triageAction(${photo.id}, 'discard')" 
                class="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium min-h-[44px] flex items-center justify-center gap-2">
          <i class="fa-solid fa-trash"></i>
          Discard
        </button>
        <button onclick="triageAction(${photo.id}, 'duplicate')" 
                class="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium min-h-[44px] flex items-center justify-center gap-2">
          <i class="fa-solid fa-copy"></i>
          Duplicate
        </button>
      </div>
    </div>
    
    <div class="mt-4 flex gap-2 justify-between">
      <button onclick="previousPhoto()" 
              class="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg min-h-[44px] ${currentTriageIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
              ${currentTriageIndex === 0 ? 'disabled' : ''}>
        <i class="fa-solid fa-arrow-left mr-2"></i>Previous
      </button>
      <button onclick="nextPhoto()" 
              class="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg min-h-[44px] ${currentTriageIndex === triagePhotos.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
              ${currentTriageIndex === triagePhotos.length - 1 ? 'disabled' : ''}>
        Next<i class="fa-solid fa-arrow-right ml-2"></i>
      </button>
    </div>
    
    <div class="mt-4 text-xs text-neutral-500 text-center">
      <p>Keyboard shortcuts: ← → to navigate, K to keep, D to discard, U for duplicate</p>
    </div>
  `;
}

function renderTriageGrid() {
  const container = document.getElementById('triage-photos');
  const gridDiv = document.getElementById('triage-grid');
  
  if (!gridDiv || triagePhotos.length === 0) return;

  if (container) container.classList.add('hidden');
  gridDiv.classList.remove('hidden');

  gridDiv.innerHTML = triagePhotos.map((photo, index) => {
    const thumbnail = photo.files?.find(f => f.kind === 'thumbnail') || 
                      photo.files?.find(f => f.kind === 'master');
    return `
      <div class="bg-white rounded-lg overflow-hidden border-2 ${index === currentTriageIndex ? 'border-blue-500' : 'border-neutral-200'} cursor-pointer"
           onclick="selectTriagePhoto(${index})">
        ${thumbnail ? `<img src="${API.getFileUrl(thumbnail.id)}" alt="Photo" class="w-full h-48 object-cover">` : ''}
        <div class="p-2">
          <p class="text-xs text-neutral-600 truncate">${escapeHtml(photo.original_filename || 'Unknown')}</p>
        </div>
      </div>
    `;
  }).join('');
}

window.selectTriagePhoto = function(index) {
  currentTriageIndex = index;
  isGridView = false;
  renderTriageView();
};

window.previousPhoto = function() {
  if (currentTriageIndex > 0) {
    currentTriageIndex--;
    renderTriagePhoto();
  }
};

window.nextPhoto = function() {
  if (currentTriageIndex < triagePhotos.length - 1) {
    currentTriageIndex++;
    renderTriagePhoto();
  }
};

window.skipPhoto = function() {
  if (currentTriageIndex < triagePhotos.length - 1) {
    currentTriageIndex++;
    renderTriagePhoto();
  } else if (currentTriageIndex > 0) {
    currentTriageIndex--;
    renderTriagePhoto();
  }
};

window.triageAction = async function(photoId, action) {
  try {
    showLoading('Processing...');
    await API.triagePhoto(photoId, action);
    hideLoading();
    
    // Remove photo from array
    triagePhotos = triagePhotos.filter(p => p.id !== photoId);
    
    // Adjust index if needed
    if (currentTriageIndex >= triagePhotos.length && currentTriageIndex > 0) {
      currentTriageIndex--;
    }
    
    if (triagePhotos.length === 0) {
      const container = document.getElementById('triage-photos');
      const emptyDiv = document.getElementById('triage-empty');
      if (container) container.classList.add('hidden');
      if (emptyDiv) emptyDiv.classList.remove('hidden');
    } else {
      renderTriageView();
    }
  } catch (error) {
    hideLoading();
    showError('Failed to process: ' + error.message);
  }
};

// Metadata handlers
let currentMetadataPhoto = null;
let availablePeople = [];
let availableTags = [];

function setupMetadataHandlers(photoId) {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Go back to previous view (could be triage or search)
      if (triagePhotos.length > 0) {
        showTriage();
      } else {
        showDashboard();
      }
    });
  }

  loadPhotoMetadata(photoId);
  loadPeopleAndTags();
}

async function loadPeopleAndTags() {
  try {
    const [peopleData, tagsData] = await Promise.all([
      API.getPeople(currentLibrary.id),
      API.getTags(currentLibrary.id),
    ]);
    availablePeople = peopleData.people || [];
    availableTags = tagsData.tags || [];
  } catch (error) {
    console.error('Failed to load people/tags:', error);
  }
}

async function loadPhotoMetadata(photoId) {
  const loadingDiv = document.getElementById('metadata-loading');
  const contentDiv = document.getElementById('metadata-content');

  if (loadingDiv) loadingDiv.classList.remove('hidden');
  if (contentDiv) contentDiv.classList.add('hidden');

  try {
    const data = await API.getPhoto(photoId);
    currentMetadataPhoto = data.photo;
    renderMetadataForm(data.photo);
    
    if (loadingDiv) loadingDiv.classList.add('hidden');
    if (contentDiv) contentDiv.classList.remove('hidden');
  } catch (error) {
    console.error('Failed to load photo:', error);
    if (loadingDiv) loadingDiv.classList.add('hidden');
    showError('Failed to load photo: ' + error.message);
  }
}

function renderMetadataForm(photo) {
  const form = document.getElementById('metadata-form');
  const previewImg = document.getElementById('metadata-photo-preview');
  const exifDiv = document.getElementById('exif-content');

  if (!form) return;

  // Set photo preview
  if (previewImg) {
    const master = photo.files?.find(f => f.kind === 'master') || 
                   photo.files?.find(f => f.kind === 'preview') ||
                   photo.files?.[0];
    if (master) {
      previewImg.src = API.getFileUrl(master.id);
    }
  }

  // Display EXIF data
  if (exifDiv && photo.files && photo.files.length > 0) {
    const masterFile = photo.files.find(f => f.kind === 'master') || photo.files[0];
    const exif = masterFile.metadata_json || {};
    const exifFields = [
      { label: 'Camera', value: exif.make && exif.model ? `${exif.make} ${exif.model}` : null },
      { label: 'Dimensions', value: masterFile.width && masterFile.height ? `${masterFile.width} × ${masterFile.height}` : null },
      { label: 'File Size', value: masterFile.bytes ? formatFileSize(masterFile.bytes) : null },
      { label: 'ISO', value: exif.iso },
      { label: 'Aperture', value: exif.aperture ? `f/${exif.aperture}` : null },
      { label: 'Shutter Speed', value: exif.shutterSpeed },
      { label: 'Focal Length', value: exif.focalLength ? `${exif.focalLength}mm` : null },
    ].filter(f => f.value);

    if (exifFields.length > 0) {
      exifDiv.innerHTML = exifFields.map(f => `
        <div class="flex justify-between">
          <span class="text-neutral-500">${f.label}:</span>
          <span class="text-neutral-900 font-medium">${escapeHtml(String(f.value))}</span>
        </div>
      `).join('');
    } else {
      exifDiv.innerHTML = '<p class="text-neutral-500">No EXIF data available</p>';
    }
  }

  // Format date for input
  const dateValue = photo.date_taken ? new Date(photo.date_taken).toISOString().split('T')[0] : '';
  
  // Get current people and tags
  const currentPeople = photo.people || [];
  const currentTags = photo.tags || [];

  form.innerHTML = `
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-2">Date Taken</label>
      <input type="date" 
             id="date-taken" 
             value="${dateValue}" 
             class="w-full p-3 border rounded-lg min-h-[44px]">
    </div>
    
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-2">Location</label>
      <input type="text" 
             id="location" 
             value="${escapeHtml(photo.location_text || '')}" 
             placeholder="Enter location..."
             class="w-full p-3 border rounded-lg min-h-[44px]">
    </div>
    
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-2">Description</label>
      <textarea id="description" 
                rows="4" 
                placeholder="Enter description..."
                class="w-full p-3 border rounded-lg">${escapeHtml(photo.description || '')}</textarea>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-2">People</label>
      <div id="people-tags" class="flex flex-wrap gap-2 mb-2 min-h-[44px] p-2 border rounded-lg">
        ${currentPeople.map(p => `
          <span class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            ${escapeHtml(p.name)}
            <button onclick="removePersonTag(${p.id})" class="text-blue-600 hover:text-blue-800">
              <i class="fa-solid fa-times text-xs"></i>
            </button>
          </span>
        `).join('')}
      </div>
      <div class="flex gap-2">
        <select id="person-select" class="flex-1 p-2 border rounded-lg min-h-[44px]">
          <option value="">Add person...</option>
          ${availablePeople.filter(p => !currentPeople.find(cp => cp.id === p.id)).map(p => `
            <option value="${p.id}">${escapeHtml(p.name)}</option>
          `).join('')}
        </select>
        <button onclick="addPersonTag()" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg min-h-[44px] min-w-[80px]">
          Add
        </button>
      </div>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-neutral-900 mb-2">Tags</label>
      <div id="tag-tags" class="flex flex-wrap gap-2 mb-2 min-h-[44px] p-2 border rounded-lg">
        ${currentTags.map(t => `
          <span class="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            ${escapeHtml(t.name)}
            <button onclick="removeTagTag(${t.id})" class="text-green-600 hover:text-green-800">
              <i class="fa-solid fa-times text-xs"></i>
            </button>
          </span>
        `).join('')}
      </div>
      <div class="flex gap-2">
        <input type="text" 
               id="tag-input" 
               placeholder="Add tag..."
               class="flex-1 p-2 border rounded-lg min-h-[44px]"
               onkeypress="if(event.key==='Enter'){event.preventDefault();addTagTag();}">
        <button onclick="addTagTag()" 
                class="px-4 py-2 bg-green-600 text-white rounded-lg min-h-[44px] min-w-[80px]">
          Add
        </button>
      </div>
    </div>
    
    <div class="pt-4 border-t border-neutral-200">
      <button onclick="saveMetadata(${photo.id})" 
              class="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-lg font-medium min-h-[44px] mb-2">
        <i class="fa-solid fa-save mr-2"></i>Save & Continue
      </button>
      <button onclick="saveMetadataAndNext(${photo.id})" 
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium min-h-[44px]">
        <i class="fa-solid fa-forward mr-2"></i>Save & Next Photo
      </button>
    </div>
  `;
}

window.addPersonTag = async function() {
  const select = document.getElementById('person-select');
  const personId = select?.value;
  if (!personId || !currentMetadataPhoto) return;

  try {
    await API.tagPhotoWithPerson(currentMetadataPhoto.id, parseInt(personId));
    await loadPhotoMetadata(currentMetadataPhoto.id);
    await loadPeopleAndTags();
  } catch (error) {
    showError('Failed to add person: ' + error.message);
  }
};

window.removePersonTag = async function(personId) {
  if (!currentMetadataPhoto) return;

  try {
    await API.removePersonFromPhoto(currentMetadataPhoto.id, personId);
    await loadPhotoMetadata(currentMetadataPhoto.id);
  } catch (error) {
    showError('Failed to remove person: ' + error.message);
  }
};

window.addTagTag = async function() {
  const input = document.getElementById('tag-input');
  const tagName = input?.value?.trim();
  if (!tagName || !currentMetadataPhoto) return;

  try {
    await API.addTagToPhoto(currentMetadataPhoto.id, tagName);
    input.value = '';
    await loadPhotoMetadata(currentMetadataPhoto.id);
    await loadPeopleAndTags();
  } catch (error) {
    showError('Failed to add tag: ' + error.message);
  }
};

window.removeTagTag = async function(tagId) {
  if (!currentMetadataPhoto) return;

  try {
    await API.removeTagFromPhoto(currentMetadataPhoto.id, tagId);
    await loadPhotoMetadata(currentMetadataPhoto.id);
  } catch (error) {
    showError('Failed to remove tag: ' + error.message);
  }
};

window.saveMetadata = async function(photoId) {
  try {
    showLoading('Saving...');
    const data = {
      date_taken: document.getElementById('date-taken').value || null,
      location_text: document.getElementById('location').value || null,
      description: document.getElementById('description').value || null,
    };
    await API.updatePhoto(photoId, data);
    await API.completePhoto(photoId);
    hideLoading();
    showSuccess('Metadata saved successfully');
    
    // Return to previous view
    setTimeout(() => {
      if (triagePhotos.length > 0) {
        showTriage();
      } else {
        showDashboard();
      }
    }, 1000);
  } catch (error) {
    hideLoading();
    showError('Failed to save: ' + error.message);
  }
};

window.saveMetadataAndNext = async function(photoId) {
  try {
    await saveMetadata(photoId);
    // After saving, try to load next photo in metadata_entry state
    try {
      const tasks = await API.getNextTasks(currentLibrary.id);
      if (tasks.queues.metadata_entry && tasks.queues.metadata_entry.photos && tasks.queues.metadata_entry.photos.length > 0) {
        const nextPhoto = tasks.queues.metadata_entry.photos[0];
        showMetadata(nextPhoto.id);
      } else {
        showDashboard();
      }
    } catch (e) {
      showDashboard();
    }
  } catch (error) {
    // Error already handled in saveMetadata
  }
};

// Search handlers
let searchDebounceTimer = null;
let currentSearchPage = 1;
let searchFilters = {};

function setupSearchHandlers() {
  const backBtn = document.getElementById('btn-back');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('btn-search-submit');
  const filtersBtn = document.getElementById('btn-filters');
  const filtersDiv = document.getElementById('search-filters');
  const applyFiltersBtn = document.getElementById('btn-apply-filters');
  const clearFiltersBtn = document.getElementById('btn-clear-filters');

  if (backBtn) backBtn.addEventListener('click', () => showDashboard());
  
  if (searchBtn) searchBtn.addEventListener('click', () => {
    currentSearchPage = 1;
    performSearch();
  });
  
  if (searchInput) {
    // Debounced search
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        currentSearchPage = 1;
        performSearch();
      }, 500);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentSearchPage = 1;
        performSearch();
      }
    });
  }

  if (filtersBtn) {
    filtersBtn.addEventListener('click', () => {
      if (filtersDiv) {
        filtersDiv.classList.toggle('hidden');
      }
    });
  }

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      applyFilters();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      clearFilters();
    });
  }
}

function applyFilters() {
  const dateFrom = document.getElementById('filter-date-from')?.value || '';
  const dateTo = document.getElementById('filter-date-to')?.value || '';
  
  searchFilters = {};
  if (dateFrom) searchFilters.date_from = dateFrom;
  if (dateTo) searchFilters.date_to = dateTo;
  
  currentSearchPage = 1;
  performSearch();
}

function clearFilters() {
  searchFilters = {};
  const dateFromInput = document.getElementById('filter-date-from');
  const dateToInput = document.getElementById('filter-date-to');
  if (dateFromInput) dateFromInput.value = '';
  if (dateToInput) dateToInput.value = '';
  
  currentSearchPage = 1;
  performSearch();
}

async function performSearch() {
  const query = document.getElementById('search-input')?.value || '';
  const loadingDiv = document.getElementById('search-loading');
  const resultsDiv = document.getElementById('search-results');
  const emptyDiv = document.getElementById('search-empty');
  const infoDiv = document.getElementById('search-results-info');
  const paginationDiv = document.getElementById('search-pagination');

  if (loadingDiv) loadingDiv.classList.remove('hidden');
  if (resultsDiv) resultsDiv.innerHTML = '';
  if (emptyDiv) emptyDiv.classList.add('hidden');
  if (infoDiv) infoDiv.classList.add('hidden');
  if (paginationDiv) paginationDiv.classList.add('hidden');

  try {
    const params = {
      q: query,
      page: currentSearchPage,
      limit: 24,
      ...searchFilters,
    };
    
    const data = await API.searchPhotos(currentLibrary.id, params);
    
    if (loadingDiv) loadingDiv.classList.add('hidden');
    
    if (data.photos && data.photos.length > 0) {
      renderSearchResults(data.photos, data.pagination);
    } else {
      if (emptyDiv) emptyDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Search failed:', error);
    if (loadingDiv) loadingDiv.classList.add('hidden');
    showError('Search failed: ' + error.message);
  }
}

function renderSearchResults(photos, pagination) {
  const container = document.getElementById('search-results');
  const infoDiv = document.getElementById('search-results-info');
  const paginationDiv = document.getElementById('search-pagination');
  const emptyDiv = document.getElementById('search-empty');

  if (!container) return;

  if (photos.length === 0) {
    if (emptyDiv) emptyDiv.classList.remove('hidden');
    return;
  }

  if (emptyDiv) emptyDiv.classList.add('hidden');

  // Show result count
  if (infoDiv && pagination) {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(start + photos.length - 1, pagination.total);
    infoDiv.textContent = `Showing ${start}-${end} of ${pagination.total} photos`;
    infoDiv.classList.remove('hidden');
  }

  // Render photos
  container.innerHTML = photos.map(photo => {
    const thumbnail = photo.thumbnail;
    const dateStr = photo.date_taken ? new Date(photo.date_taken).toLocaleDateString() : 'No date';
    const filename = photo.original_filename || 'Unknown';
    
    return `
      <div class="bg-white rounded-lg overflow-hidden border border-neutral-200 cursor-pointer hover:shadow-lg transition-shadow"
           onclick="showPhotoDetail(${photo.id})">
        <div class="aspect-square bg-neutral-100 overflow-hidden">
          ${thumbnail ? `
            <img src="${thumbnail.url}" 
                 alt="${escapeHtml(filename)}" 
                 class="w-full h-full object-cover"
                 loading="lazy"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect fill=\\'%23e5e5e5\\' width=\\'200\\' height=\\'200\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'14\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
          ` : `
            <div class="w-full h-full flex items-center justify-center text-neutral-400">
              <i class="fa-solid fa-image text-4xl"></i>
            </div>
          `}
        </div>
        <div class="p-3">
          <p class="text-xs text-neutral-500 truncate mb-1">${escapeHtml(filename)}</p>
          <p class="text-sm text-neutral-700 font-medium">${dateStr}</p>
        </div>
      </div>
    `;
  }).join('');

  // Render pagination
  if (paginationDiv && pagination && pagination.pages > 1) {
    paginationDiv.classList.remove('hidden');
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.pages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    if (pagination.page > 1) {
      pages.push(`<button onclick="goToSearchPage(${pagination.page - 1})" 
                         class="px-3 py-2 border rounded-lg min-h-[44px] min-w-[44px]">
                   <i class="fa-solid fa-chevron-left"></i>
                 </button>`);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(`<button onclick="goToSearchPage(${i})" 
                         class="px-4 py-2 border rounded-lg min-h-[44px] min-w-[44px] ${i === pagination.page ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700'}">
                   ${i}
                 </button>`);
    }

    if (pagination.page < pagination.pages) {
      pages.push(`<button onclick="goToSearchPage(${pagination.page + 1})" 
                         class="px-3 py-2 border rounded-lg min-h-[44px] min-w-[44px]">
                   <i class="fa-solid fa-chevron-right"></i>
                 </button>`);
    }

    paginationDiv.innerHTML = pages.join('');
  }
}

window.goToSearchPage = function(page) {
  currentSearchPage = page;
  performSearch();
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

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
