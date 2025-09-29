import { requestClient } from '#/api/request';

export namespace PlanApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface PageData {
    customerId?: number;
    validTag?: number;
    status?: number;
  }

  export interface PlanData {
    insureSn: string;
    groupId: number | string;
    groupName: string;
    mainInsureId: string;
    mainInsureName: string;
    additionalInsureId: string;
    additionalInsureName: string;
    beginTime: string;
    endTime: string;
    status: number;
  }

  export interface PlanDetail extends PlanData {
    id: number;
    customerName?: string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface PlanResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function PlanListApi(
  data: PlanApi.PageData,
  params: PlanApi.PageParams,
) {
  return requestClient.post<PlanApi.ListResult>('/customer/insure/list', data, {
    params,
  });
}

/**
 * 添加主险或副险方案接口
 */
export async function PlanAddApi(data: PlanApi.PlanData) {
  return requestClient.post<PlanApi.PlanResult>('/customer/insure/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function PlanUpdateApi(data: PlanApi.PlanDetail) {
  return requestClient.post<PlanApi.PlanResult>(
    '/customer/insure/update',
    data,
  );
}

/**
 * 获取主险或副险方案详情接口
 */
export async function PlanGetApi(id: number | string) {
  return requestClient.get<PlanApi.PlanDetail>('/customer/insure/get', {
    params: { id },
  });
}

/**
 * 删除主险或副险方案接口
 */
export async function PlanDelApi(id: number | string) {
  return requestClient.post<PlanApi.PlanDetail>(
    '/customer/insure/del',
    {},
    { params: { id } },
  );
}
