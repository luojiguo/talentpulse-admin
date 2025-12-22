import iconv from 'iconv-lite';

/**
 * 修复文件名编码，解决中文文件名上传时的乱码问题
 * @param {string} filename - 原始文件名
 * @returns {string} - 修复后的文件名
 */
export function fixFilenameEncoding(filename) {
  // 尝试将当前字符串视为 ISO-8859-1 编码的字节，重新用 UTF-8 解码
  try {
    const buf = iconv.encode(filename, 'latin1'); // latin1 = ISO-8859-1
    return iconv.decode(buf, 'utf8');
  } catch (err) {
    console.warn('Filename encoding fix failed, using original:', filename);
    return filename;
  }
}

/**
 * 修复文件名编码，解决中文文件名上传时的乱码问题
 * @param {string} filename - 原始文件名
 * @returns {string} - 修复后的文件名
 */
export function generateSafeFilename(filename) {
  // 修复文件名编码
  return fixFilenameEncoding(filename);
}