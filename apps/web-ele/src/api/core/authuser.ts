import { requestClient } from '#/api/request';

export namespace UserListApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    organid: number;
  }

  export enum Role {
    Admin = 13, // 管理员
    BusinessCustomer = 16, // 业务客户
    BusinessOperator = 15, // 业务操作员
    BusinessSupervisor = 14, // 业务主管
  }

  export interface UserData {
    username: string;
    description: string;
    phone: string;
    password?: string;
    roleId: Role | string;
    state: number;
  }

  export interface UserDetail extends UserData {
    id: number;
  }

  /** 登录接口返回值 */
  export interface UserResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface UserinfoResult {
    result: string;
  }
}

/**
 * 获取用户列表
 */
export async function authUserListApi(params: UserListApi.PageParams) {
  return requestClient.post<UserListApi.UserResult>(
    '/user/getusers',
    {},
    {
      params,
    },
  );
}

/**
 * 添加用户
 */
export async function UserAddApi(data: UserListApi.UserData) {
  return requestClient.post<UserListApi.UserData>('/user/add', data);
}

/**
 * 更新用户
 */
export async function UserUpdateApi(data: UserListApi.UserDetail) {
  return requestClient.post<UserListApi.UserData>('/user/editv2', data);
}

/**
 * 获取用户详情
 */
export async function UserGetApi(uid: number | string) {
  return requestClient.get<UserListApi.UserData>('/user/getUser', {
    params: { uid },
  });
}
