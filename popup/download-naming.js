(function(global){
  /**
   * Helper: tạo tên file theo quy tắc promptIndex.imageIndex.ext
   * Sử dụng:
   *   ImageDownloadNaming.generateFilename(1, 2, '.png', { prefix:'p-', suffix:'-v1' })
   *   ImageDownloadNaming.downloadImagesForPrompt(1, [blobOrUrl1, blobOrUrl2], '.png', { prefix, suffix, subfolder })
   */

  function ensureDotExt(ext) {
    if (!ext) return '.png';
    return ext.startsWith('.') ? ext : `.${ext}`;
  }

  function sanitizeFilePart(part) {
    if (!part) return '';
    // Remove problematic characters for filenames
    return String(part).replace(/[\/\\?%*:|"<>]/g, '-');
  }

  function generateFilename(promptIndex, imageIndex, ext, options = {}) {
    const prefix = options.prefix ? sanitizeFilePart(options.prefix) : '';
    const suffix = options.suffix ? sanitizeFilePart(options.suffix) : '';
    const base = `${promptIndex}.${imageIndex}`;
    const dotExt = ensureDotExt(ext);
    return `${prefix}${base}${suffix}${dotExt}`;
  }

  function downloadBlobWithName(blob, filename, options = {}) {
    // If running in extension background with chrome.downloads available and filename supports folders,
    // prefer using chrome.downloads.download for better filename control.
    const tryChromeDownloads = typeof chrome !== 'undefined' && chrome.downloads && typeof chrome.downloads.download === 'function';
    if (tryChromeDownloads) {
      try {
        // chrome.downloads.download accepts URLs; createObjectURL and pass it.
        const url = URL.createObjectURL(blob);
        const downloadOptions = { url, filename };
        if (options.conflictAction) downloadOptions.conflictAction = options.conflictAction; // 'uniquify'|'overwrite'|'prompt'
        chrome.downloads.download(downloadOptions, function(downloadId) {
          // revoke after small delay
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        });
        return;
      } catch (e) {
        // fallback to anchor method
        console.warn('chrome.downloads.download failed, falling back to anchor download', e);
      }
    }

    // Fallback: anchor element download (works in most browsers but folder path may be ignored)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;

    // Some browsers ignore folder paths in download attribute; but set anyway if provided
    a.download = options.subfolder ? `${options.subfolder}/${filename}` : filename;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try { document.body.removeChild(a); } catch (e) {}
      URL.revokeObjectURL(url);
    }, 300);
  }

  async function fetchToBlobIfNeeded(item) {
    if (!item) return null;
    if (typeof item === 'string') {
      // treat as URL
      try {
        const res = await fetch(item);
        return await res.blob();
      } catch (e) {
        console.error('Failed to fetch image URL:', item, e);
        return null;
      }
    }
    // If it's a Response
    if (item instanceof Response) {
      return await item.blob();
    }
    // If it's already a Blob or File
    if (item instanceof Blob || (typeof File !== 'undefined' && item instanceof File)) {
      return item;
    }
    // Unknown type
    return null;
  }

  async function downloadImagesForPrompt(promptIndex, itemsArray, ext = '.png', options = {}) {
    if (!Array.isArray(itemsArray)) return;
    const normalizedExt = ensureDotExt(ext);
    for (let i = 0; i < itemsArray.length; i++) {
      const imageIndex = i + 1;
      const item = itemsArray[i];
      const blob = await fetchToBlobIfNeeded(item);
      if (!blob) continue;
      const filename = generateFilename(promptIndex, imageIndex, normalizedExt, options);
      downloadBlobWithName(blob, filename, options);
      // Small delay to avoid download floods
      await new Promise(r => setTimeout(r, options.delayMs || 120));
    }
  }

  // Expose
  global.ImageDownloadNaming = {
    generateFilename,
    downloadBlobWithName,
    downloadImagesForPrompt
  };

})(window);
