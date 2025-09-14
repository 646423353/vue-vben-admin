import { requestClient } from '#/api/request';

export namespace CityApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface PageData {
    customerId?: number | string;
    id?: number;
  }

  export interface CityData {
    customerId: number | string;
    name: string;
    owner: string;
    phone: string;
  }

  export interface CityDetail extends CityData {
    id: number;
    customerName?: string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface CityResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function CityListApi(
  data: CityApi.PageData,
  params: CityApi.PageParams,
) {
  return requestClient.post<CityApi.ListResult>('/city/list', data, { params });
}

/**
 * 添加主险或副险方案接口
 */
export async function CityAddApi(data: CityApi.CityData) {
  return requestClient.post<CityApi.CityResult>('/city/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function CityUpdateApi(data: CityApi.CityDetail) {
  return requestClient.post<CityApi.CityResult>('/city/update', data);
}

/**
 * 获取主险或副险方案详情接口
 */
export async function CityGetApi(id: number | string) {
  return requestClient.get<CityApi.CityDetail>('/city/get', { params: { id } });
}

/**
 * 删除主险或副险方案接口
 */
export async function CityDelApi(id: number | string) {
  return requestClient.post<CityApi.CityDetail>(
    '/city/del',
    {},
    { params: { id } },
  );
}
