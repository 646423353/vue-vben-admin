import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

interface NewUserInfo {
  username?: string;
  description?: string;
  file?: string;
  password?: string;
  oldpassword?: string;
}
/**
 * 获取用户信息
 */
export async function getUserInfoApi(uid: number) {
  return requestClient.get<UserInfo>('/user/getUser', { params: { uid } });
}

/**
 * 修改用户信息
 */
export async function updateUserinfo(data: NewUserInfo) {
  return requestClient.post<NewUserInfo>('/user/updatemyinfo', data);
}
