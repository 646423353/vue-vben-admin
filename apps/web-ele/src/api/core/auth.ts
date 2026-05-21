import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken?: string;
    token: string;
    id: number;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  export interface Role {
    id: number;
    name: string;
    permissions: string;
    description: string;
  }
}

/**
 * 登录
 */
export async function loginApi(params: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/user/login', {}, { params });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  // return requestClient.get<string[]>('/auth/codes');
  return ['13', '14', '15', '16'];
}

/**
 * 获取图形验证码
 */
export function getValidImg() {
  return '/api/validate/img';
}

/**
 * 获取用户权限列表
 */
export async function getRoles() {
  return requestClient.get<AuthApi.Role[]>('/user/getRoles');
}

/**
 * 校验是否为 OAuth2 登录场景
 */
export async function checkOAuth2Api() {
  try {
    // 改用 baseRequestClient，避免被普通 requestClient 拦截器的 401 逻辑强退而导致死循环重定向
    // 并携带凭证 Cookie (withCredentials: true) 以正确读取 Session 中的 SavedRequest 状态
    const resp = await baseRequestClient.get<{ oauth2: boolean }>(
      '/api/oauth2/check',
      {
        withCredentials: true,
      },
    );
    return resp.data || { oauth2: false };
  } catch {
    return { oauth2: false };
  }
}

/**
 * 从 Cookie 中读取指定名称的 CSRF Token（默认为 XSRF-TOKEN）
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const name = 'XSRF-TOKEN';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}
