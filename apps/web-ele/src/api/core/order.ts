import { requestClient } from '#/api/request';
import { useUserCustomerStore } from '#/store/userCustomer';

export namespace OrderApi {
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface PageData {
    customer?: string;
    orderSn?: string;
    orderId?: string;
    type?: number;
    tags?: string;
    zt?: number;
    consignTime?: string;
    endTime?: string;
    safetype?: string;
    lzxtype?: string;
    ywxtype?: string;
    riderName?: string;
    riderIdCard?: string;
    tbrName?: string;
    policyNo?: string;
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
    stopName: string;
    idNum: string;
  }

  export interface OrderData {
    consignTime: Date | string;
    customer: string;
    emailAdd: string;
    emailMain: string;
    endTime: Date | string;
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
    needsynctag?: number;
    tbType?: number;
    tbTypeZx?: number;
    type?: number;
  }
  export type OptionalOrderData = Partial<OrderData>;

  export interface OrderDetail extends OptionalOrderData {
    id: number;
    orderId?: string;
    customerName?: string;
    mainInsure?: string;
    addiInsure?: string;
    tbrName?: string;
    tbcardtype?: string;
    tbCardtype?: string;
    tbCard?: string;
    tbrPhone?: string;
    tbrEmail?: string;
    tbrAddress?: string;
    created?: string;
    delTag?: number;
    sourceType?: number;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface OrderResult {
    result: string;
    policyCount?: number;
    policySuccessCount?: number;
    policyFailCount?: number;
  }

  export interface MembersData {
    beginTime?: string;
    bxbm?: string;
    creditcard?: string;
    customerId?: string;
    endTime?: string;
    lzxtype?: string;
    orderId?: number | string;
    safetype?: string;
    userid?: number;
    username?: string;
    ywxtype?: string;
    insureTime?: number | string;
    iscurrent?: number;
    /** Feature 2: 查询区间起始日期（成员 beginTime >= 此值）*/
    rangeBeginTime?: string;
    /** Feature 2: 查询区间结束日期（成员 endTime <= 此值）*/
    rangeEndTime?: string;
    /** Feature 2: 成员状态 */
    statusPerson?: number;
    tags?: null | string;
    periodBeginTime?: string;
    periodEndTime?: string;
  }

  export interface MembersDetail extends MembersData {
    id: number;
  }

  export interface MembersMatchData extends MemberDto {
    matchResult?: string[];
    matchResultTag?: number;
    orderNo: string;
    uuid: string;
  }

  export interface LogData extends MembersData {
    logDateBegin?: number | string;
    logDateEnd?: number | string;
  }

  export interface MembersStatus {
    created?: string;
    id?: number;
    orderId?: string;
    orderNo?: string;
    peoplecount: number;
    status2: number;
    status3: number;
    status4: number;
    status5: number;
    updated?: string;
  }
}

/**
 * 获取订单列表接口
 */
export async function OrderListApi(
  data: OrderApi.PageData,
  params: OrderApi.PageParams,
) {
  const userCustomerStore = useUserCustomerStore();
  const customer = await userCustomerStore.getCustomerParamValue(data.customer);
  const requestData = { ...data, customer };

  return requestClient.post<OrderApi.ListResult>(
    '/order/gz/list',
    requestData,
    {
      params,
    },
  );
}

/**
 * 获取直投订单列表接口
 */
export async function OrderListPersonApi(
  data: OrderApi.PageData,
  params: OrderApi.PageParams,
) {
  const userCustomerStore = useUserCustomerStore();
  const customer = await userCustomerStore.getCustomerParamValue(data.customer);
  const requestData = { ...data, customer };

  return requestClient.post<OrderApi.ListResult>(
    '/order/gz/list/person',
    requestData,
    {
      params,
    },
  );
}

/**
 * 获取直投订单详情接口
 */
export async function OrderGetPersonApi(id: number | string) {
  return requestClient.get<OrderApi.OrderDetail>('/order/gz/get/person', {
    params: { id },
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
  const userCustomerStore = useUserCustomerStore();
  const customerId = await userCustomerStore.getCustomerParamValue(data.customerId);
  const requestData = { ...data, customerId };

  return requestClient.post<OrderApi.ListResult>(
    '/order/gz/members',
    requestData,
    {
      params,
    },
  );
}

/**
 * 获取直投订单成员接口
 */
export async function OrderMembersPersonApi(
  data: OrderApi.MembersData,
  params: OrderApi.PageParams,
) {
  const userCustomerStore = useUserCustomerStore();
  const customerId = await userCustomerStore.getCustomerParamValue(data.customerId);
  const requestData = { ...data, customerId };

  return requestClient.post<OrderApi.ListResult>(
    '/order/gz/members/person',
    requestData,
    {
      params,
    },
  );
}

/**
 * 人员导出接口
 */
export async function MembersExportApi(data: OrderApi.MembersData) {
  return requestClient.post<string>('/order/gz/members/export', data);
}

/**
 * 人员匹配接口
 */
export async function MembersUpdateApi(data: OrderApi.MembersMatchData[]) {
  return requestClient.post<OrderApi.MembersMatchData[]>(
    '/order/gz/member/update',
    data,
  );
}

/**
 * 人员匹配接口
 */
export async function MembersMatchApi(data: OrderApi.MembersMatchData[]) {
  return requestClient.post<OrderApi.MembersMatchData[]>(
    '/order/gz/members/match',
    data,
  );
}

/**
 * 订单补投创建日保单接口
 */
export async function OrderTaskAddApi(params: { orderId: number | string }) {
  return requestClient.post<OrderApi.OrderResult>('/task/add/order', null, {
    params,
  });
}

/**
 * 获取批单记录接口
 */
export async function OrderMembersLogApi(
  data: OrderApi.LogData,
  params: OrderApi.PageParams,
) {
  const userCustomerStore = useUserCustomerStore();
  const customerId = await userCustomerStore.getCustomerParamValue(data.customerId);
  const requestData = { ...data, customerId };

  return requestClient.post<OrderApi.ListResult>(
    '/order/gz/members/log',
    requestData,
    {
      params,
    },
  );
}

/**
 * 获取订单修改日志接口
 */
export async function OrderLogListApi(params: {
  orderId: number | string;
  page?: number;
  size?: number;
}) {
  return requestClient.get<OrderApi.ListResult>('/order/log/list', {
    params,
  });
}

/**
 * 记录导出接口
 */
export async function LogExportApi(data: OrderApi.LogData) {
  const userCustomerStore = useUserCustomerStore();
  const customerId = await userCustomerStore.getCustomerParamValue(data.customerId);
  const requestData = { ...data, customerId };

  return requestClient.post<string>(
    '/order/gz/members/log/export',
    requestData,
  );
}

/**
 * 订单成员状态接口
 */
export async function OrderMembersStatusApi(id: number | string) {
  return requestClient.get<OrderApi.MembersStatus>('/order/member/status', {
    params: { id },
  });
}

/**
 * 导出普通订单(非直投)
 */
export async function OrderExportApi(
  data: OrderApi.PageData,
  params: { beginTime?: string; endTime?: string },
) {
  const userCustomerStore = useUserCustomerStore();
  const customer = await userCustomerStore.getCustomerParamValue(data.customer);
  const requestData = { ...data, customer };

  return requestClient.post<string>('/order/export', requestData, {
    params,
  });
}

/**
 * 导出主险直投订单(最多1000条)
 */
export async function OrderZxExportApi(
  data: OrderApi.PageData,
  params: { beginTime?: string; endTime?: string },
) {
  const userCustomerStore = useUserCustomerStore();
  const customer = await userCustomerStore.getCustomerParamValue(data.customer);
  const requestData = { ...data, customer };

  return requestClient.post<string>('/order/zx/export', requestData, {
    params,
  });
}

/**
 * 导出附加险直投订单(最多1000条)
 */
export async function OrderFjxExportApi(
  data: OrderApi.PageData,
  params: { beginTime?: string; endTime?: string },
) {
  const userCustomerStore = useUserCustomerStore();
  const customer = await userCustomerStore.getCustomerParamValue(data.customer);
  const requestData = { ...data, customer };

  return requestClient.post<string>('/order/fjx/export', requestData, {
    params,
  });
}
