import { requestClient } from '#/api/request';

export namespace UserListApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    organid: number;
  }

  /** 登录接口返回值 */
  export interface UserResult {
    list: any[];
  }
}

/**
 * 获取用户列表
 */
export async function authUserListApi(params: UserListApi.PageParams) {
  return requestClient.get<UserListApi.UserResult>('/user/getusers', {
    params,
  });
}
