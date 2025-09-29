import { requestClient } from '#/api/request';

export namespace PolicyApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface BBRPageParams {
    page: number;
    size: number;
    id: number | string;
  }

  export interface PageData {
    // 保单起期
    beginTime?: string;
    // 客户id
    customerid?: number;
    // 客户名称
    customername?: string;
    // 保单止期
    endTime?: string;
    // ID
    id?: number;
    // 订单创建人id
    jobId?: number;
    // 订单别名
    orderComment?: string;
    // 订单号字符串
    orderNo?: string;
    // 订单id
    orderid?: string;
    // 是否已有pdf 0没有 1已经有
    pdfStatus?: number;
    // 0日保单 1月保单
    period?: number;
    // 保单号
    policyNo?: string;
    // 是否已有保单号 0没有 1有
    policynoStatus?: number;
    // 投保操作编号
    seq?: string;
    // 保单来源 0自动投保 1保单回录
    source?: number;
    // 保单状态 1 未起保 2 保障中 3 已失效 4 已退保 0 投保中 5投保失败
    status?: number;
    // 投保状态 0未投保 1投保中 2投保成功 3投保失败
    statusToubao?: number;
    // 投保人证件号
    tbCard?: string;
    // 投保人名称
    tbr?: string;
    // 投保人地址
    tbrAddress?: string;
    // 投保人证件类型 0身份证 1 企业信用代码
    tbrCardtype?: number;
    // 投保人邮箱
    tbrEmail?: string;
    // 投保人手机号
    tbrPhone?: string;
    // 0主险 1附加险
    type?: number;
    // 创建人id
    userid?: number;
    // 保单系统编号
    uuid?: string;
  }

  /**
   * 被保人信息
   */
  export interface MemberDto {
    // 证件类型，字符串类型，可以输入这两种：身份证或者企业信用代码
    cardtype?: string;
    // 备注
    comment?: string;
    // 证件号
    creditcard?: string;
    // 被保人电子邮件
    email?: string;
    // 可选的ID，整数类型
    ids?: number;
    // 可选字段，含义未知
    lzxiantag?: number;
    // 被保人手机号
    phone?: string;
    // 被保人姓名
    username?: string;
    // 可选字段，含义未知
    ywxbj?: number;
  }

  export interface PolicyData {
    beginTime: string;
    customerid: number | string;
    endTime: string;
    orderid: number | string;
    payment?: number;
    pdfurl?: string;
    peoplecount?: number;
    period?: number | string;
    policyNo?: string;
    postDae?: string;
    tbCard?: string;
    tbr?: string;
    tbrAddress?: string;
    tbrCardtype?: number | string;
    tbrEmail?: string;
    tbrPhone?: string;
    type?: number | string;
    locationtype?: number | string;
    bxfa?: string;
    bxfaId?: number | string;
    price?: string;
    members?: MemberDto[];
    pdfUrl?: string;
  }

  export type OptionalPolicyData = Partial<PolicyData>;

  export interface PolicyDetail extends OptionalPolicyData {
    id: number;
    uuid?: string;
    customername?: string;
    dt?: number | string;
    zhxbm?: string;
    zhx?: string;
    seq?: string;
    statusToubao?: number;
    status?: number;
    source?: number;
    feedback?: string;
    orderNo?: string;
  }

  export interface RecordUploadData {
    id: number | string;
    policyNo?: string;
    pdfUrl?: string;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface PolicyResult {
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
    insureTime?: string;
    iscurrent?: number;
  }

  export interface MembersDetail extends MembersData {
    id: number;
  }

  export interface LogData extends MembersData {
    logDateBegin?: number | string;
    logDateEnd?: number | string;
  }
}

/**
 * 获取保单列表接口
 */
export async function PolicyListApi(
  data: PolicyApi.PageData,
  params: PolicyApi.PageParams,
) {
  return requestClient.post<PolicyApi.ListResult>('/policy/qs/list', data, {
    params,
  });
}

/**
 * 回录保单接口
 */
export async function PolicyAddApi(data: PolicyApi.PolicyData) {
  return requestClient.post<PolicyApi.PolicyResult>('/policy/qs/add', data);
}

/**
 * 更新保单接口
 */
export async function PolicyUpdateApi(data: PolicyApi.RecordUploadData) {
  return requestClient.post<PolicyApi.PolicyResult>(
    '/policy/qs/update',
    data.pdfUrl,
    {
      params: { id: data.id, policyNo: data.policyNo },
    },
  );
}

/**
 * 获取保单详情接口
 */
export async function PolicyGetApi(id: number | string) {
  return requestClient.get<PolicyApi.PolicyDetail>('/policy/qs/detail', {
    params: { id },
  });
}

/**
 * 获取被保人接口
 */
export async function PolicyBBRGetApi(params: PolicyApi.BBRPageParams) {
  return requestClient.get<PolicyApi.ListResult>('/policy/qs/bbr/ist', {
    params,
  });
}
