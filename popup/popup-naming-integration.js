(function(global){
  if (!global.ImageDownloadNaming) {
    console.warn('ImageDownloadNaming helper chưa load. Hãy include download-naming.js trước popup.js');
  }

  /**
   * Wrapper tiện dụng, gọi underlying helper downloadImagesForPrompt
   */
  async function autoDownloadPromptImages(promptIndex, imagesArray, ext = '.png', options = {}) {
    if (!global.ImageDownloadNaming || !global.ImageDownloadNaming.downloadImagesForPrompt) {
      console.error('ImageDownloadNaming.downloadImagesForPrompt không khả dụng');
      return;
    }
    // Normalize promptIndex to 1-based integer
    let pIndex = parseInt(promptIndex, 10);
    if (isNaN(pIndex) || pIndex < 1) pIndex = 1;

    // Determine extension if imagesArray contains data URLs or URL strings with extension
    let normalizedExt = ext;
    if ((!ext || ext === '.png') && Array.isArray(imagesArray) && imagesArray.length) {
      // try to detect from first item if it's a url with extension
      const first = imagesArray[0];
      if (typeof first === 'string') {
        const m = first.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (m && m[1]) normalizedExt = `.${m[1]}`;
      }
    }

    await global.ImageDownloadNaming.downloadImagesForPrompt(pIndex, imagesArray, normalizedExt, options);
  }

  /**
   * Utility để lấy giá trị prefix/suffix/subfolder từ UI trong popup.html
   * (nếu bạn giữ các input id như trong popup.html: customFilenamePrefix, customFilenameSuffix, downloadSubfolderName)
   */
  function getOptionsFromUI() {
    const prefixEl = document.getElementById('customFilenamePrefix');
    const suffixEl = document.getElementById('customFilenameSuffix');
    const subfolderEl = document.getElementById('downloadSubfolderName');
    const toggleCustom = document.getElementById('toggleCustomFilename');
    const toggleSpecificFolder = document.getElementById('toggleSpecificDownloadFolder');

    const options = {};
    if (toggleCustom && toggleCustom.checked) {
      options.prefix = prefixEl ? prefixEl.value || '' : '';
      options.suffix = suffixEl ? suffixEl.value || '' : '';
    }
    if (toggleSpecificFolder && toggleSpecificFolder.checked) {
      options.subfolder = subfolderEl ? subfolderEl.value || '' : '';
    }
    return options;
  }

  // Expose helper to global for popup.js usage
  global.autoDownloadPromptImages = autoDownloadPromptImages;
  global.getDownloadNamingOptionsFromUI = getOptionsFromUI;

})(window);
