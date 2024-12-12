import { requestClient } from '#/api/request';

export namespace OrderApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: string;
    endTime?: string;
  }

  export interface PageData {
    cate: number;
  }

  export interface MemberDto {
    bxbm: string;
    comment: string;
    comment2: string;
    creditcard: string;
    id?: number;
    operateTag?: number;
    userid: number;
    username: string;
  }

  export interface OrderData {
    consignTime: string;
    customer: string;
    emailAdd: string;
    emailMain: string;
    endTime: string;
    locationtype: number | string;
    insureSn?: string;
    lzxtype: string;
    lzxName?: string;
    memberDtos?: MemberDto[];
    orderSn: string;
    period: string;
    remark: string;
    safetype: number | string;
    shippingCode: string;
    shippingCodeAdd: string;
    ywxtype: string;
    ywxName?: string;
  }
  export type OptionalOrderData = Partial<OrderData>;

  export interface OrderDetail extends OptionalOrderData {
    id: number;
    customerName?: string;
    mainInsure?: string;
    addiInsure?: string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface OrderResult {
    result: string;
  }

  export interface MembersData {
    beginTime?: string;
    bxbm?: string;
    creditcard?: string;
    customerId?: string;
    endTime?: string;
    lzxtype?: string;
    orderId?: string;
    safetype?: string;
    userid?: number;
    username?: string;
    ywxtype?: string;
  }

  export interface MembersDetail extends MembersData {
    id: number;
  }
}

/**
 * 获取订单列表接口
 */
export async function OrderListApi(
  data: OrderApi.PageData,
  params: OrderApi.PageParams,
) {
  return requestClient.post<OrderApi.ListResult>('/order/gz/list', data, {
    params,
  });
}

/**
 * 添加订单接口
 */
export async function OrderAddApi(data: OrderApi.OrderData) {
  return requestClient.post<OrderApi.OrderResult>('/order/gz/add', data);
}

/**
 * 更新订单接口
 */
export async function OrderUpdateApi(data: OrderApi.OrderDetail) {
  return requestClient.post<OrderApi.OrderResult>('/order/gz/update', data);
}

/**
 * 获取订单详情接口
 */
export async function OrderGetApi(id: number | string) {
  return requestClient.get<OrderApi.OrderDetail>('/order/gz/get', {
    params: { id },
  });
}

/**
 * 获取订单成员接口
 */
export async function OrderMembersApi(
  data: OrderApi.MembersData,
  params: OrderApi.PageParams,
) {
  return requestClient.post<OrderApi.ListResult>('/order/gz/members', data, {
    params,
  });
}
