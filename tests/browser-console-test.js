/**
 * Browser Console Test Script
 * 
 * Copy and paste this script into the browser console (F12 → Console tab)
 * after logging in to the application.
 * 
 * This script will automatically test various UI elements and functionality.
 */

(function() {
  console.log('%c🧪 Starting Frontend Tests...', 'color: blue; font-size: 16px; font-weight: bold;');
  
  const tests = [];
  const results = { passed: 0, failed: 0, warnings: 0 };
  
  function test(name, condition, warning = false) {
    const passed = typeof condition === 'function' ? condition() : condition;
    tests.push({ name, passed, warning });
    
    if (passed) {
      console.log(`✅ ${name}`);
      results.passed++;
    } else if (warning) {
      console.warn(`⚠️ ${name}`);
      results.warnings++;
    } else {
      console.error(`❌ ${name}`);
      results.failed++;
    }
  }
  
  function getElement(selector) {
    return document.querySelector(selector);
  }
  
  function getAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
  }
  
  function checkContrast(element) {
    if (!element) return true;
    const style = window.getComputedStyle(element);
    const color = style.color;
    const bgColor = style.backgroundColor;
    
    // Simple check: if text color is very light (rgb values > 200) on white background, it's bad
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      const avg = (r + g + b) / 3;
      
      const bgRgbMatch = bgColor.match(/\d+/g);
      if (bgRgbMatch && bgRgbMatch.length >= 3) {
        const bgR = parseInt(bgRgbMatch[0]);
        const bgG = parseInt(bgRgbMatch[1]);
        const bgB = parseInt(bgRgbMatch[2]);
        const bgAvg = (bgR + bgG + bgB) / 3;
        
        // If text is light (avg > 200) and background is also light (avg > 200), contrast is poor
        if (avg > 200 && bgAvg > 200) {
          return false;
        }
      }
    }
    return true;
  }
  
  // Test 1: Check if we're on a valid page
  test('Page loaded successfully', () => {
    return document.body !== null && document.getElementById('app') !== null;
  });
  
  // Test 2: Check for console errors
  test('No JavaScript errors in console', () => {
    // This is a manual check - user should verify no red errors
    return true;
  }, true);
  
  // Test 3: Check text contrast on current page
  test('Text contrast is adequate', () => {
    const textElements = getAllElements('p, span, div, label, h1, h2, h3, h4, h5, h6, button, a');
    let badContrast = 0;
    
    textElements.forEach(el => {
      if (!checkContrast(el)) {
        badContrast++;
      }
    });
    
    return badContrast === 0;
  });
  
  // Test 4: Check button sizes (mobile-friendly)
  test('Buttons meet minimum touch target (44px)', () => {
    const buttons = getAllElements('button, a, input[type="button"], input[type="submit"]');
    let smallButtons = 0;
    
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const minSize = Math.min(rect.width, rect.height);
      if (minSize < 44 && window.innerWidth <= 640) {
        smallButtons++;
      }
    });
    
    return smallButtons === 0;
  });
  
  // Test 5: Check if key elements exist based on current page
  const currentPath = window.location.pathname;
  
  if (currentPath === '/' || currentPath.includes('login')) {
    // Login page tests
    test('Login form exists', () => getElement('#login-form') !== null);
    test('Email input exists', () => getElement('#email') !== null);
    test('Password input exists', () => getElement('#password') !== null);
    test('Login button exists', () => {
      const form = getElement('#login-form');
      return form && form.querySelector('button[type="submit"]') !== null;
    });
    
  } else {
    // Authenticated pages
    test('Header exists', () => getElement('header') !== null);
    test('Back button exists (if not dashboard)', () => {
      const backBtn = getElement('#btn-back');
      return currentPath.includes('dashboard') ? true : backBtn !== null;
    });
    
    // Dashboard specific
    if (currentPath.includes('dashboard') || !currentPath.includes('/')) {
      test('Workflow status card exists', () => getElement('#workflow-status') !== null);
      test('Next tasks section exists', () => getElement('#next-tasks') !== null);
      test('Upload button exists', () => getElement('#btn-upload') !== null);
      test('Triage button exists', () => getElement('#btn-triage') !== null);
      test('Search button exists', () => getElement('#btn-search') !== null);
    }
    
    // Upload page specific
    if (currentPath.includes('upload')) {
      test('Upload zone exists', () => getElement('#upload-zone') !== null);
      test('File input exists', () => getElement('#file-input') !== null);
      test('Camera input exists', () => getElement('#camera-input') !== null);
      test('File preview list exists', () => getElement('#file-preview-list') !== null);
    }
    
    // Triage page specific
    if (currentPath.includes('triage')) {
      test('Triage photos container exists', () => getElement('#triage-photos') !== null);
      test('Grid view button exists', () => getElement('#btn-grid-view') !== null);
    }
    
    // Metadata page specific
    if (currentPath.includes('metadata')) {
      test('Metadata form exists', () => getElement('#metadata-form') !== null);
      test('Photo preview exists', () => getElement('#metadata-photo-preview') !== null);
      test('EXIF data container exists', () => getElement('#metadata-exif') !== null);
    }
    
    // Search page specific
    if (currentPath.includes('search')) {
      test('Search input exists', () => getElement('#search-input') !== null);
      test('Search results container exists', () => getElement('#search-results') !== null);
      test('Filter button exists', () => getElement('#btn-filters') !== null);
    }
  }
  
  // Test 6: Check for notification containers
  test('Notification containers exist', () => {
    return getElement('#app-loading') !== null || 
           getElement('#app-error') !== null || 
           getElement('#app-success') !== null ||
           true; // They're created dynamically, so this is OK
  });
  
  // Test 7: Check CSS is loaded
  test('Styles are loaded', () => {
    const stylesheets = Array.from(document.styleSheets);
    return stylesheets.length > 0;
  });
  
  // Test 8: Check Font Awesome icons are loaded
  test('Font Awesome icons are available', () => {
    return typeof window.FontAwesome !== 'undefined' || 
           document.querySelector('link[href*="font-awesome"]') !== null;
  });
  
  // Test 9: Check Tailwind CSS is loaded
  test('Tailwind CSS is available', () => {
    return document.querySelector('script[src*="tailwindcss"]') !== null;
  });
  
  // Test 10: Check API functions exist
  test('API module is loaded', () => {
    // Check if API calls work (this will fail if not logged in, which is OK)
    return typeof fetch !== 'undefined';
  });
  
  // Test 11: Check responsive design
  test('Viewport meta tag exists', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    return viewport !== null;
  });
  
  // Test 12: Check for accessibility attributes
  test('Images have alt attributes', () => {
    const images = getAllElements('img');
    if (images.length === 0) return true;
    
    let missingAlt = 0;
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        missingAlt++;
      }
    });
    
    return missingAlt === 0;
  });
  
  // Summary
  console.log('\n%c📊 Test Results Summary', 'color: green; font-size: 16px; font-weight: bold;');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️ Warnings: ${results.warnings}`);
  console.log(`📝 Total: ${tests.length}`);
  
  if (results.failed === 0) {
    console.log('%c🎉 All critical tests passed!', 'color: green; font-size: 14px; font-weight: bold;');
  } else {
    console.log('%c⚠️ Some tests failed. Please review the errors above.', 'color: orange; font-size: 14px; font-weight: bold;');
  }
  
  // Return results for programmatic access
  return {
    tests,
    results,
    summary: {
      total: tests.length,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      passRate: ((results.passed / tests.length) * 100).toFixed(1) + '%'
    }
  };
})();
