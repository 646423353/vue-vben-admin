import { useAccess } from '@vben/access';

const { hasAccessByRoles } = useAccess();

/**
 * 判断当前用户是否为超级管理员
 * @returns {boolean} 如果是超级管理员返回true，否则返回false
 */
export function isSuperAdmin(): boolean {
  return hasAccessByRoles(['超级管理员', '管理员', '理赔员']);
}

/**
 * 格式化身份证号，只显示前四位和后四位，中间用*代替
 * @param idCard 身份证号码
 * @returns 格式化后的身份证号码
 */
export function formatIdCard(idCard: string): string {
  if (!idCard || typeof idCard !== 'string') {
    return '';
  }

  if (isSuperAdmin()) {
    return idCard;
  }

  // 处理包含X的身份证号，保留X并转换为大写
  const cleanIdCard = idCard.toUpperCase();
  // 只保留数字和X
  const validChars = cleanIdCard.replaceAll(/[^0-9X]/g, '');

  // 检查长度是否为15位或18位
  if (validChars.length !== 15 && validChars.length !== 18) {
    return idCard; // 如果不是标准长度，返回原始值
  }

  // 获取前四位和后四位
  const prefix = validChars.slice(0, 4);
  const suffix = validChars.slice(-4);

  // 计算需要显示的星号数量
  const asterisksCount = validChars.length - 8;
  const asterisks = '*'.repeat(asterisksCount);

  return `${prefix}${asterisks}${suffix}`;
}
