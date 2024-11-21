import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi(id: number) {
  return requestClient.post<UserInfo>(
    '/user/getOneUser',
    {},
    { params: { id } },
  );
}
