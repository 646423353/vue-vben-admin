export function replaceUrlWithCurrentDomain(originalUrl: string) {
  const currentLocation = window.location;

  const currentHostname = currentLocation.hostname;
  const currentPort = currentLocation.port ? `:${currentLocation.port}` : ''; // 处理没有指定端口的情况

  const currentDomain = `${currentLocation.protocol}//${currentHostname}${currentPort}`;

  const oldDomain = 'http://39.99.217.49:8082';

  if (originalUrl.startsWith(oldDomain)) {
    const pathAfterDomain = originalUrl.slice(oldDomain.length);

    const newPath = pathAfterDomain.replace(/^\/swagger\//, '/api/swagger/');

    return `${currentDomain}${newPath}`;
  }

  return originalUrl;
}
