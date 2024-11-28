import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi(uid: number) {
  return requestClient.get<UserInfo>('/user/getUser', { params: { uid } });
}
