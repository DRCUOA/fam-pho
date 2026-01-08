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
        <button id="btn-logout" class="p-2 text-neutral-600">
          <i class="fa-solid fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
    <main class="px-4 py-6 pb-20">
      <section class="mb-8">
        <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div class="flex items-center mb-3">
            <div class="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center mr-3">
              <i class="fa-solid fa-check text-white text-sm"></i>
            </div>
            <div>
              <h2 class="text-base text-neutral-900">Current Stage</h2>
              <p class="text-sm text-neutral-600">Ready to Upload</p>
            </div>
          </div>
        </div>
      </section>
      <section class="mb-8">
        <h3 class="text-base text-neutral-900 mb-4">Quick Actions</h3>
        <div class="space-y-3">
          <button id="btn-upload" 
                  class="w-full bg-neutral-900 text-white rounded-lg p-4 flex items-center justify-between">
            <div class="flex items-center">
              <i class="fa-solid fa-cloud-arrow-up text-xl mr-3"></i>
              <span class="text-base">Upload Photos</span>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button id="btn-triage" 
                  class="w-full bg-white border border-neutral-200 rounded-lg p-4 flex items-center justify-between">
            <div class="flex items-center">
              <i class="fa-solid fa-list-check text-xl mr-3 text-neutral-600"></i>
              <div class="text-left">
                <div class="text-base text-neutral-900">Review Queue</div>
                <div class="text-sm text-neutral-500"><span id="triage-count">0</span> photos waiting</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-neutral-400"></i>
          </button>
          <button id="btn-search" 
                  class="w-full bg-white border border-neutral-200 rounded-lg p-4 flex items-center justify-between">
            <div class="flex items-center">
              <i class="fa-solid fa-magnifying-glass text-xl mr-3 text-neutral-600"></i>
              <span class="text-base text-neutral-900">Search Archive</span>
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
        <button id="btn-back" class="p-2 text-neutral-600">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Upload Photos</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="px-4 py-6">
      <div id="upload-zone" 
           class="upload-zone rounded-lg p-12 text-center cursor-pointer mb-4">
        <i class="fa-solid fa-cloud-arrow-up text-5xl text-neutral-400 mb-4"></i>
        <p class="text-neutral-600 mb-2">Drag and drop photos here</p>
        <p class="text-sm text-neutral-500">or</p>
        <button id="btn-upload-files" 
                class="mt-4 bg-neutral-900 text-white px-6 py-2 rounded-lg">
          Select Files
        </button>
        <input type="file" id="file-input" multiple accept="image/*" capture class="hidden">
      </div>
      <div id="file-list" class="space-y-2 mb-4"></div>
      <div id="upload-status" class="text-sm"></div>
    </main>
  `;
}

export function renderTriage(library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Review Queue</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="px-4 py-6">
      <div id="triage-photos"></div>
    </main>
  `;
}

export function renderMetadata(photoId, library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Metadata Entry</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="px-4 py-6">
      <form id="metadata-form" class="bg-white rounded-lg p-4"></form>
    </main>
  `;
}

export function renderSearch(library) {
  return `
    <header class="bg-white border-b border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <button id="btn-back" class="p-2 text-neutral-600">
          <i class="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 class="text-lg text-neutral-900">Search Archive</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="px-4 py-6">
      <div class="mb-4">
        <div class="flex gap-2">
          <input type="text" id="search-input" 
                 placeholder="Search photos..." 
                 class="flex-1 p-2 border rounded">
          <button id="btn-search-submit" 
                  class="bg-neutral-900 text-white px-6 py-2 rounded">
            Search
          </button>
        </div>
      </div>
      <div id="search-results" class="photo-grid"></div>
    </main>
  `;
}
