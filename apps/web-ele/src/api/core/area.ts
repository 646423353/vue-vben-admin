import { requestClient } from '#/api/request';

export namespace AreaApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface PageData {
    customerId?: string;
  }

  export interface AreaData {
    customerId: number | string;
    name: string;
    owner: string;
    phone: string;
  }

  export interface AreaDetail extends AreaData {
    id: number;
    customerName?: string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface AreaResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function AreaListApi(
  data: AreaApi.PageData,
  params: AreaApi.PageParams,
) {
  return requestClient.post<AreaApi.ListResult>('/area/list', data, { params });
}

/**
 * 添加主险或副险方案接口
 */
export async function AreaAddApi(data: AreaApi.AreaData) {
  return requestClient.post<AreaApi.AreaResult>('/area/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function AreaUpdateApi(data: AreaApi.AreaDetail) {
  return requestClient.post<AreaApi.AreaResult>('/area/update', data);
}

/**
 * 获取主险或副险方案详情接口
 */
export async function AreaGetApi(id: number | string) {
  return requestClient.get<AreaApi.AreaDetail>('/area/get', { params: { id } });
}

/**
 * 删除主险或副险方案接口
 */
export async function AreaDelApi(id: number | string) {
  return requestClient.post<AreaApi.AreaDetail>(
    '/area/del',
    {},
    { params: { id } },
  );
}
