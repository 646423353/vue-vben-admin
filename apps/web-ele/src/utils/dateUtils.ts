import moment from 'moment';

/**
 * 格式化时间戳
 * @param {number|string} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimestamp(timestamp: number | string): string {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
}
