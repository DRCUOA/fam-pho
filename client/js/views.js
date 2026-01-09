// View rendering functions

export function renderLogin() {
  return `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <h1 class="text-3xl font-bold text-center mb-8">Family Photo Archive</h1>
        <form id="login-form" class="bg-white rounded-lg shadow p-6">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Email</label>
            <input type="email" id="email" required 
                   class="w-full p-2 border rounded">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Password</label>
            <input type="password" id="password" required 
                   class="w-full p-2 border rounded">
          </div>
          <button type="submit" 
                  class="w-full bg-neutral-900 text-white py-3 rounded-lg">
            Login
          </button>
        </form>
      </div>
    </div>
  `;
}

export function renderDashboard(user, library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <h1 class="text-lg text-neutral-900">Family Archive</h1>
        <button id="btn-logout" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
    <main class="px-4 py-6 pb-20">
      <section class="mb-6">
        <div id="workflow-status" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center mb-2">
            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <i id="workflow-icon" class="fa-solid fa-cloud-arrow-up text-white"></i>
            </div>
            <div class="flex-1">
              <h2 class="text-base font-medium text-neutral-900">Current Stage</h2>
              <p id="workflow-stage" class="text-sm text-neutral-600">Loading...</p>
            </div>
          </div>
          <div id="workflow-progress" class="mt-3">
            <div class="flex justify-between text-xs text-neutral-600 mb-1">
              <span>Workflow Progress</span>
              <span id="workflow-percent">0%</span>
            </div>
            <div class="w-full bg-neutral-200 rounded-full h-2">
              <div id="workflow-progress-bar" class="bg-blue-600 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="mb-6">
        <h3 class="text-base font-medium text-neutral-900 mb-3">Next Tasks</h3>
        <div id="next-tasks" class="space-y-2">
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900"></div>
            <p class="text-neutral-600 mt-2 text-sm">Loading tasks...</p>
          </div>
        </div>
      </section>
      
      <section class="mb-8">
        <h3 class="text-base font-medium text-neutral-900 mb-3">Quick Actions</h3>
        <div class="space-y-3">
          <button id="btn-upload" 
                  class="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg p-4 flex items-center justify-between min-h-[60px] transition-colors">
            <div class="flex items-center">
              <i class="fa-solid fa-cloud-arrow-up text-xl mr-3"></i>
              <span class="text-base font-medium">Upload Photos</span>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button id="btn-triage" 
                  class="w-full bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex items-center justify-between min-h-[60px] transition-colors">
            <div class="flex items-center flex-1">
              <i class="fa-solid fa-list-check text-xl mr-3 text-neutral-600"></i>
              <div class="text-left flex-1">
                <div class="text-base text-neutral-900 font-medium">Review Queue</div>
                <div class="text-sm text-neutral-500"><span id="triage-count">0</span> photos waiting</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-neutral-400"></i>
          </button>
          <button id="btn-metadata" 
                  class="w-full bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex items-center justify-between min-h-[60px] transition-colors">
            <div class="flex items-center flex-1">
              <i class="fa-solid fa-tags text-xl mr-3 text-neutral-600"></i>
              <div class="text-left flex-1">
                <div class="text-base text-neutral-900 font-medium">Metadata Entry</div>
                <div class="text-sm text-neutral-500"><span id="metadata-count">0</span> photos waiting</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-neutral-400"></i>
          </button>
          <button id="btn-search" 
                  class="w-full bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex items-center justify-between min-h-[60px] transition-colors">
            <div class="flex items-center">
              <i class="fa-solid fa-magnifying-glass text-xl mr-3 text-neutral-600"></i>
              <span class="text-base text-neutral-900 font-medium">Search Archive</span>
            </div>
            <i class="fa-solid fa-chevron-right text-neutral-400"></i>
          </button>
        </div>
      </section>
    </main>
  `;
}

export function renderUpload(library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Upload Photos</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="px-4 py-6 pb-20">
      <div id="upload-zone" 
           class="upload-zone rounded-lg p-8 md:p-12 text-center cursor-pointer mb-4 transition-all">
        <i class="fa-solid fa-cloud-arrow-up text-4xl md:text-5xl text-neutral-400 mb-4"></i>
        <p class="text-neutral-600 mb-2 text-base md:text-lg">Drag and drop photos here</p>
        <p class="text-sm text-neutral-500 mb-4">or</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button id="btn-upload-files" 
                  class="bg-neutral-900 text-white px-6 py-3 rounded-lg min-h-[44px] min-w-[140px] font-medium">
            <i class="fa-solid fa-folder-open mr-2"></i>Select Files
          </button>
          <button id="btn-camera-capture" 
                  class="bg-neutral-700 text-white px-6 py-3 rounded-lg min-h-[44px] min-w-[140px] font-medium">
            <i class="fa-solid fa-camera mr-2"></i>Take Photo
          </button>
        </div>
        <input type="file" id="file-input" multiple accept="image/*" class="hidden">
        <input type="file" id="camera-input" accept="image/*" capture="environment" class="hidden">
      </div>
      <div id="file-preview-list" class="space-y-3 mb-4"></div>
      <div id="upload-progress" class="mb-4 hidden">
        <div class="bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div id="progress-bar" class="bg-blue-600 h-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <p id="progress-text" class="text-sm text-neutral-600 mt-2 text-center">Uploading...</p>
      </div>
      <div id="upload-status" class="text-sm mb-4"></div>
      <div id="upload-actions" class="hidden">
        <button id="btn-upload-start" 
                class="w-full bg-green-600 text-white py-3 rounded-lg font-medium min-h-[44px] mb-2">
          Upload Selected Files
        </button>
        <button id="btn-clear-files" 
                class="w-full bg-neutral-200 text-neutral-700 py-3 rounded-lg font-medium min-h-[44px]">
          Clear All
        </button>
      </div>
    </main>
  `;
}

export function renderTriage(library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Review Queue</h1>
        <button id="btn-grid-view" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-th-large text-lg"></i>
        </button>
      </div>
    </header>
    <main class="px-4 py-6 pb-20">
      <div id="triage-loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
        <p class="text-neutral-600 mt-4">Loading photos...</p>
      </div>
      <div id="triage-photos" class="hidden"></div>
      <div id="triage-empty" class="hidden text-center py-12">
        <i class="fa-solid fa-check-circle text-5xl text-green-500 mb-4"></i>
        <p class="text-lg text-neutral-900 mb-2">All caught up!</p>
        <p class="text-neutral-600">No photos in the review queue.</p>
      </div>
      <div id="triage-grid" class="hidden photo-grid"></div>
    </main>
  `;
}

export function renderMetadata(photoId, library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Metadata Entry</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="px-4 py-6 pb-20">
      <div id="metadata-loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
        <p class="text-neutral-600 mt-4">Loading photo...</p>
      </div>
      <div id="metadata-content" class="hidden">
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div class="bg-neutral-100 rounded-lg overflow-hidden">
            <img id="metadata-photo-preview" 
                 alt="Photo preview" 
                 class="w-full h-auto max-h-[60vh] object-contain"
                 loading="lazy">
          </div>
          <div id="metadata-exif" class="bg-white rounded-lg p-4 border border-neutral-200">
            <h3 class="text-sm font-medium text-neutral-900 mb-3">EXIF Data</h3>
            <div id="exif-content" class="text-xs text-neutral-600 space-y-1"></div>
          </div>
        </div>
        <form id="metadata-form" class="bg-white rounded-lg p-4 border border-neutral-200 space-y-4"></form>
      </div>
    </main>
  `;
}

export function renderSearch(library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Search Archive</h1>
        <button id="btn-filters" class="p-2 text-neutral-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i class="fa-solid fa-filter text-lg"></i>
        </button>
      </div>
    </header>
    <main class="px-4 py-6 pb-20">
      <div class="mb-4">
        <div class="flex gap-2">
          <input type="text" id="search-input" 
                 placeholder="Search photos..." 
                 class="flex-1 p-3 border rounded-lg min-h-[44px]">
          <button id="btn-search-submit" 
                  class="bg-neutral-900 text-white px-6 py-3 rounded-lg min-h-[44px] min-w-[80px]">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
      </div>
      
      <div id="search-filters" class="mb-4 hidden bg-white rounded-lg p-4 border border-neutral-200">
        <h3 class="text-sm font-medium text-neutral-900 mb-3">Filters</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-neutral-700 mb-1">Date From</label>
            <input type="date" id="filter-date-from" class="w-full p-2 border rounded text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-neutral-700 mb-1">Date To</label>
            <input type="date" id="filter-date-to" class="w-full p-2 border rounded text-sm">
          </div>
          <button id="btn-apply-filters" 
                  class="w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium min-h-[44px]">
            Apply Filters
          </button>
          <button id="btn-clear-filters" 
                  class="w-full bg-neutral-100 text-neutral-700 py-2 rounded-lg text-sm font-medium min-h-[44px]">
            Clear Filters
          </button>
        </div>
      </div>
      
      <div id="search-loading" class="hidden text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
        <p class="text-neutral-600 mt-4">Searching...</p>
      </div>
      
      <div id="search-results-info" class="mb-4 text-sm text-neutral-600 hidden"></div>
      
      <div id="search-results" class="photo-grid"></div>
      
      <div id="search-empty" class="hidden text-center py-12">
        <i class="fa-solid fa-search text-5xl text-neutral-300 mb-4"></i>
        <p class="text-lg text-neutral-900 mb-2">No photos found</p>
        <p class="text-neutral-600">Try adjusting your search or filters.</p>
      </div>
      
      <div id="search-pagination" class="mt-6 flex justify-center gap-2 hidden"></div>
    </main>
  `;
}
