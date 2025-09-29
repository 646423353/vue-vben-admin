import type { AgreementApi } from './agreement';

import { requestClient } from '#/api/request';

export namespace CustomerApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
    withTag?: number;
    withStop?: number;
    withInsure?: number;
  }

  export interface PageData {
    id?: number;
    username?: string;
    uid?: string;
    city?: number | string;
  }

  export interface PlanParams {
    id?: string;
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

  export interface SiteParams {
    id?: string;
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

  export interface AgreementParams extends AgreementApi.AgreementData {
    id?: string;
  }

  export interface CustomerData {
    city: number | string;
    carda: string;
    cardb: string;
    mail: string;
    pdf: string;
    systemnum: string;
    ticket: string;
    username: string;
    zhizao: string;
    tags: string;
    tbCustomerInsureDtos: PlanParams[];
    tbCustomerStopDtos: SiteParams[];
    tbCustomerAgreementDtos: AgreementParams[];
  }

  export interface TagData {
    id: number;
    name: string;
  }

  export interface CustomerDetail extends CustomerData {
    id: number;
    insures?: PlanParams[];
    stops?: SiteParams[];
    customerTags?: TagData[];
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface CustomerResult {
    result: string;
  }
}

/**
 * 获取客户列表接口
 */
export async function CustomerListApi(
  data: CustomerApi.PageData,
  params: CustomerApi.PageParams,
) {
  return requestClient.post<CustomerApi.ListResult>('/customer/list', data, {
    params,
  });
}

/**
 * 添加客户接口
 */
export async function CustomerAddApi(data: CustomerApi.CustomerData) {
  return requestClient.post<CustomerApi.CustomerResult>('/customer/add', data);
}

/**
 * 更新客户接口
 */
export async function CustomerUpdateApi(data: CustomerApi.CustomerDetail) {
  return requestClient.post<CustomerApi.CustomerResult>(
    '/customer/update',
    data,
  );
}

/**
 * 获取客户详情接口
 */
export async function CustomerGetApi(id: number | string) {
  return requestClient.get<CustomerApi.CustomerDetail>('/customer/get', {
    params: { id },
  });
}

/**
 * 删除客户接口
 */
export async function CustomerDelApi(id: number | string) {
  return requestClient.post<CustomerApi.CustomerDetail>(
    '/customer/del',
    {},
    { params: { id } },
  );
}

/**
 * 获取客户主险或副险方案列表接口
 */
export async function CustomerAccountsApi(
  page: number,
  size: number,
  customerId: number | string,
) {
  return requestClient.get<CustomerApi.ListResult>('/customer/accounts', {
    params: { page, size, customerId },
  });
}
