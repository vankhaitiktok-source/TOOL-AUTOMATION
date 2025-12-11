// Helper: đặt tên và tải các ảnh theo kiểu promptIndex.imageIndex.ext
// Sử dụng: downloadImagesForPrompt(1, [blob1, blob2], '.png', { prefix, suffix, subfolder })

(function(global){
  /**
   * Tạo filename theo quy ước:
   *  - Basic: `${promptIndex}.${imageIndex}${ext}`
   *  - Nếu prefix hoặc suffix được bật thì sẽ chèn trước/sau (ví dụ prefix + '1.1' + suffix + '.png')
   */
  function generateFilename(promptIndex, imageIndex, ext, options = {}) {
    const prefix = options.prefix ? String(options.prefix) : '';
    const suffix = options.suffix ? String(options.suffix) : '';
    const base = `${promptIndex}.${imageIndex}`;
    // Ensure ext starts with dot
    const dotExt = ext && ext.startsWith('.') ? ext : (ext ? `.${ext}` : '');
    return `${prefix}${base}${suffix}${dotExt}`;
  }

  /**
   * Tải một Blob với filename, cố gắng đặt subfolder nếu trình duyệt/OS hỗ trợ webkitdirectory-like behavior.
   * Lưu ý: Chrome/Edge/Firefox không cho set folder trong DOM download attribute; subfolder chỉ hoạt động
   * nếu người dùng dùng extension API hoặc zip trước khi tải. Tuy nhiên vẫn để tham số cho tương lai.
   */
  function downloadBlobWithName(blob, filename, options = {}) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    // Subfolder: browsers ignore folder paths in most cases, but keep for completeness: 'folder/name.ext'
    if (options.subfolder) {
      a.download = `${options.subfolder}/${filename}`;
    }
    document.body.appendChild(a);
    a.click();
    // cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  /**
   * Tải mảng blobs (các ảnh) cho một prompt xác định bởi promptIndex.
   * blobsArray: mảng Blob hoặc Response/ArrayBuffer; nếu là URL string, helper sẽ fetch trước.
   * ext: ví dụ '.png' hoặc 'png' — hàm sẽ chuẩn hóa
   * options: { prefix, suffix, subfolder }
   */
  async function downloadImagesForPrompt(promptIndex, blobsArray, ext = '.png', options = {}) {
    if (!Array.isArray(blobsArray)) return;
    const normalizedExt = ext && ext.startsWith('.') ? ext : (ext ? `.${ext}` : '.png');
    for (let i = 0; i < blobsArray.length; i++) {
      const imageIndex = i + 1;
      let blob = blobsArray[i];
      // If passed a URL, fetch it
      if (typeof blob === 'string') {
        try {
          const res = await fetch(blob);
          blob = await res.blob();
        } catch (e) {
          console.error('Failed to fetch image URL:', blob, e);
          continue;
        }
      }
      const filename = generateFilename(promptIndex, imageIndex, normalizedExt, options);
      downloadBlobWithName(blob, filename, options);
      // small delay to avoid flooding downloads
      await new Promise(r => setTimeout(r, 80));
    }
  }

  // Expose to global for easy usage from popup.js
  global.ImageDownloadNaming = {
    generateFilename,
    downloadBlobWithName,
    downloadImagesForPrompt
  };

})(window);