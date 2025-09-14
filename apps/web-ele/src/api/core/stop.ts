import { requestClient } from '#/api/request';

export namespace StopApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface PageData {
    customerId?: string;
    catecity?: number | string;
  }

  export interface StopData {
    name: string;
    owner: string;
    phone: string;
    province: string | undefined;
    city: string | undefined;
    district: string | undefined;
    addr: string;
    address: string;
    status: number;
  }

  export interface StopDetail extends StopData {
    id: number;
    customerName?: string;
    catecityName?: string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface StopResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function StopListApi(
  data: StopApi.PageData,
  params: StopApi.PageParams,
) {
  return requestClient.post<StopApi.ListResult>('/stop/list', data, { params });
}

/**
 * 添加主险或副险方案接口
 */
export async function StopAddApi(data: StopApi.StopData) {
  return requestClient.post<StopApi.StopResult>('/stop/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function StopUpdateApi(data: StopApi.StopDetail) {
  return requestClient.post<StopApi.StopResult>('/stop/update', data);
}

/**
 * 获取主险或副险方案详情接口
 */
export async function StopGetApi(id: number | string) {
  return requestClient.get<StopApi.StopDetail>('/stop/get', { params: { id } });
}

/**
 * 删除主险或副险方案接口
 */
export async function StopDelApi(id: number | string) {
  return requestClient.post<StopApi.StopDetail>(
    '/stop/del',
    {},
    { params: { id } },
  );
}
