import { requestClient } from '#/api/request';

export namespace PhoneApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
  }

  export interface CustomerPageParams extends PageParams {
    id: number | string;
  }

  export interface PhoneData {
    type: 0 | 1 | '0' | '1' | '';
    customerIds: number | string;
    phone: string;
  }

  export interface PhoneDetail {
    id: number;
    customerIds: number | string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface PhoneResult {
    result: string;
  }
}

/**
 * 获取所有投保手机号
 */
export async function PhoneListApi(params: PhoneApi.PageParams) {
  return requestClient.get<PhoneApi.ListResult>('/task/phone/list', { params });
}

/**
 * 添加投保手机号
 */
export async function PhoneAddApi(params: PhoneApi.PhoneData) {
  return requestClient.post<PhoneApi.PhoneResult>(
    '/task/phone/add',
    params.customerIds,
    { params: { type: params.type, phone: params.phone } },
  );
}

/**
 * 更新手机号的自动投保客户（换成请求体里的客户，数据库的都删掉）
 */
export async function PhoneUpdateApi(params: PhoneApi.PhoneDetail) {
  return requestClient.post<PhoneApi.PhoneResult>(
    '/task/phone/customer/update',
    params.customerIds,
    { params: { id: params.id } },
  );
}

/**
 * 删除某个投保手机号
 */
export async function PhoneDelApi(id: number | string) {
  return requestClient.post<PhoneApi.PhoneResult>(
    '/task/phone/del',
    {},
    { params: { id } },
  );
}

/**
 * 获取手机号对应的所有客户
 */
export async function PhoneCustomerApi(params: PhoneApi.CustomerPageParams) {
  return requestClient.get<PhoneApi.ListResult>('/task/phone/customer', {
    params,
  });
}
