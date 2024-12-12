import { requestClient } from '#/api/request';

export namespace CustomerApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: string;
    endTime?: string;
  }

  export interface PageData {
    username?: string;
  }

  interface PlanParams {
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

  interface SiteParams {
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

  export interface CustomerData {
    carda: string;
    cardb: string;
    mail: string;
    pdf: string;
    systemnum: string;
    ticket: string;
    username: string;
    zhizao: string;
    tbCustomerInsureDtos: PlanParams[];
    tbCustomerStopDtos: SiteParams[];
  }

  export interface CustomerDetail extends CustomerData {
    id: number;
    insures?: PlanParams[];
    stops?: SiteParams[];
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
 * 获取主险或副险方案列表接口
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
 * 添加主险或副险方案接口
 */
export async function CustomerAddApi(data: CustomerApi.CustomerData) {
  return requestClient.post<CustomerApi.CustomerResult>('/customer/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function CustomerUpdateApi(data: CustomerApi.CustomerDetail) {
  return requestClient.post<CustomerApi.CustomerResult>(
    '/customer/update',
    data,
  );
}

/**
 * 获取主险或副险方案详情接口
 */
export async function CustomerGetApi(id: number | string) {
  return requestClient.get<CustomerApi.CustomerDetail>('/customer/get', {
    params: { id },
  });
}

/**
 * 删除主险或副险方案接口
 */
export async function CustomerDelApi(id: number | string) {
  return requestClient.post<CustomerApi.CustomerDetail>(
    '/customer/del',
    {},
    { params: { id } },
  );
}
