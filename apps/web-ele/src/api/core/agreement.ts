import { requestClient } from '#/api/request';

export namespace AgreementApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    startTime?: number | string;
    endTime?: number | string;
    tag?: '1' | '2';
  }

  export interface PageData {
    code?: string;
    customerId?: string;
    name?: string;
    startTime?: number | string;
    endTime?: number | string;
    validStatus?: number;
  }

  export interface AgreementData {
    attachs?: string;
    code?: string;
    customerId?: number | string;
    endTime?: number | string;
    name?: string;
    remark?: string;
    startTime?: number | string;
    validStatus?: number;
  }

  export interface AgreementDetail extends AgreementData {
    id?: string;
    customerName?: string;
    expired?: number;
    created?: number | string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface AgreementResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function AgreementListApi(
  data: AgreementApi.PageData,
  params: AgreementApi.PageParams,
) {
  return requestClient.post<AgreementApi.ListResult>('/agreement/list', data, {
    params,
  });
}

/**
 * 添加主险或副险方案接口
 */
export async function AgreementAddApi(data: AgreementApi.AgreementData) {
  return requestClient.post<AgreementApi.AgreementResult>(
    '/agreement/add',
    data,
  );
}

/**
 * 更新主险或副险方案接口
 */
export async function AgreementUpdateApi(data: AgreementApi.AgreementDetail) {
  return requestClient.post<AgreementApi.AgreementResult>(
    '/agreement/update',
    data,
  );
}

/**
 * 获取主险或副险方案详情接口
 */
export async function AgreementGetApi(id: number | string) {
  return requestClient.get<AgreementApi.AgreementDetail>('/agreement/get', {
    params: { id },
  });
}

/**
 * 删除主险或副险方案接口
 */
export async function AgreementDelApi(id: number | string) {
  return requestClient.post<AgreementApi.AgreementDetail>(
    '/agreement/del',
    {},
    { params: { id } },
  );
}
