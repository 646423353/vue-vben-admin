export function replaceUrlWithCurrentDomain(originalUrl: string) {
  const currentLocation = window.location;

  const currentHostname = currentLocation.hostname;
  const currentPort = currentLocation.port ? `:${currentLocation.port}` : ''; // 处理没有指定端口的情况

  const currentDomain = `${currentLocation.protocol}//${currentHostname}${currentPort}`;

  const oldDomain = 'http://39.99.217.49:8082';

  if (originalUrl.startsWith(oldDomain)) {
    const pathAfterDomain = originalUrl.slice(oldDomain.length);

    const newPath = pathAfterDomain.replace(
      /^\/swagger\//,
      '/qishou/api/swagger/',
    );

    return `${currentDomain}${newPath}`;
  }

  return originalUrl;
}

/**
 * 从PDF文件URL中获取文件名
 * @param pdfUrl - PDF文件的完整URL
 * @returns 返回提取的文件名，如果未找到则返回空字符串
 */
export function getPdfFileName(pdfUrl: string): string {
  const lastSlashIndex = pdfUrl.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return '';
  }
  return pdfUrl.slice(lastSlashIndex + 1);
}
