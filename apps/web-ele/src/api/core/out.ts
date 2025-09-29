import { requestClient } from '#/api/request';

export namespace OpenApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }
}

/**
 * 获取查询所有渠道和配置列表接口
 */
export async function OpenChannelListApi(params: OpenApi.PageParams) {
  return requestClient.get<OpenApi.ListResult>('/open/channel', { params });
}

/**
 * 查询api日志接口
 */
export async function OpenLogListApi(params: OpenApi.PageParams) {
  return requestClient.get<OpenApi.ListResult>('/open/log', { params });
}
