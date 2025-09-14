import { requestClient } from '#/api/request';

export namespace TagApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
  }

  export interface TagData {
    name: string;
  }

  export interface TagDetail extends TagData {
    id: number;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface TagResult {
    result: string;
  }
}

/**
 * 获取分组列表接口
 */
export async function TagListApi(params: TagApi.PageParams) {
  return requestClient.get<TagApi.ListResult>('/tag/list', {
    params,
  });
}

/**
 * 添加分组接口
 */
export async function TagAddApi(data: TagApi.TagData) {
  return requestClient.post<TagApi.TagResult>('/tag/add', data);
}

/**
 * 更新分组接口
 */
export async function TagUpdateApi(data: TagApi.TagDetail) {
  return requestClient.post<TagApi.TagResult>('/tag/update', data);
}

/**
 * 删除分组接口
 */
export async function TagDelApi(id: number | string) {
  return requestClient.post<TagApi.TagDetail>(
    '/tag/del',
    {},
    { params: { id } },
  );
}
