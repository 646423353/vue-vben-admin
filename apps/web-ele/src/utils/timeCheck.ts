import { useAccess } from '@vben/access';
import { alert } from '@vben/common-ui';

const { hasAccessByRoles } = useAccess();
/**
 * 判断当前时间是否在指定的时间范围内
 * @param {number} startHour 开始小时（0-23）
 * @param {number} endHour 结束小时（0-23）
 * @returns {boolean} 如果当前时间在指定范围内返回true，否则返回false
 */
export function isInTimeRange(startHour: number, endHour: number): boolean {
  const now = new Date();
  const hours = now.getHours();

  // 使用三元表达式替代if-else语句
  return startHour <= endHour
    ? hours >= startHour && hours < endHour // 同一天内的时间范围
    : hours >= startHour || hours < endHour; // 跨天的时间范围（例如22:00-次日06:00）
}

/**
 * 判断当前用户是否为超级管理员
 * @returns {boolean} 如果是超级管理员返回true，否则返回false
 */
export function isSuperAdmin(): boolean {
  return hasAccessByRoles(['超级管理员', '管理员']);
}

/**
 * 检查是否在结算时间段内（20:00-24:00）
 * 如果在结算时间段内，会显示提示弹窗
 * 超级管理员不受时间限制
 * @returns {boolean} 如果在结算时间段内且不是超级管理员返回true，否则返回false
 */
export function checkSettlementTime(): boolean {
  // 超级管理员不受时间限制
  if (isSuperAdmin()) {
    return false;
  }

  if (isInTimeRange(20, 24)) {
    alert({
      content:
        '每日结算时间段（20:00-24:00），期间无法增减员。请在每天20:00前完成当天操作。如有问题请联系您的业务负责人。',
      icon: 'error',
    });
    return true;
  }
  return false;
}

/**
 * 检查是否在结算时间段内（自定义时间范围）
 * 如果在结算时间段内，会显示提示弹窗
 * 超级管理员不受时间限制
 * @param {number} startHour 开始小时（0-23）
 * @param {number} endHour 结束小时（0-23）
 * @param {string} message 自定义提示消息
 * @returns {boolean} 如果在结算时间段内且不是超级管理员返回true，否则返回false
 */
export function checkCustomTimeRange(
  startHour: number,
  endHour: number,
  message: string = '当前时间段内无法执行此操作',
): boolean {
  // 超级管理员不受时间限制
  if (isSuperAdmin()) {
    return false;
  }

  if (isInTimeRange(startHour, endHour)) {
    alert({
      content: message,
      icon: 'error',
    });
    return true;
  }
  return false;
}
