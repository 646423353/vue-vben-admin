import { type CustomerApi } from '#/api/core/customer';
import { type OrderApi } from '#/api/core/order';
import { requestClient } from '#/api/request';

export namespace CaseApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
    anjianBeginTime?: number | string;
    anjianEndTime?: number | string;
  }

  export interface PageData {
    address?: string;
    bxbm?: string;
    casenoInsuredAttach?: string;
    casenoInsuredMain?: string;
    city?: string;
    cityCode?: string;
    companyId?: string;
    companyName?: string;
    created?: string;
    creditcard?: string;
    details?: string;
    district?: string;
    districtCode?: string;
    fujiaxian?: string;
    id?: number;
    insureTime?: string;
    insureType?: number[];
    insuredAttach?: string[];
    insuredAttachName?: string;
    insuredMain?: string[];
    insuredMainName?: string;
    name?: string;
    owner?: string[];
    phone?: string;
    phoneOwner?: string;
    policyNo?: string;
    policyNoAttach?: string;
    province?: string;
    provinceCode?: string;
    status?: number[];
    stopId?: string;
    stopName?: string;
    stopOwner?: string;
    stopOwnerName?: string;
    stopOwnerPhone?: string;
    updated?: string;
    userid?: string;
    useridUpdate?: string;
    username?: string;
    usernameUpdate?: string;
    zeren?: number[];
    closeTime?: string;
    usernameOwner?: string;
    lipeiPerson?: number | string;
    moneryAttach?: number | string;
    moneyDianfu?: number | string;
    moneyMain?: number | string;
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

  export interface CaseData {
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
  export type OptionalCaseData = Partial<PageData>;

  export type CaseDetail = {
    accidentPicture: string;
    addressPicture: string;
    cardPicture: string;
    diseasePicture: string;
    goodPicture: string;
    id: number;
    insuredAttach: string;
    insuredMain: string;
    insureType: number;
    modifyPicture: string;
    orderPicture: string;
    otherPicture: string;
    owner: string;
    status: number;
    ticketPicture: string;
    zeren: number;
  } & OptionalCaseData;

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface CaseResult {
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
    logDateBegin?: string;
    logDateEnd?: string;
  }

  export interface CardData extends OrderApi.MembersData {
    statusPerson: number;
    phone: string;
    customer: CustomerApi.CustomerDetail;
    stops: CustomerApi.SiteParams[];
    insures: CustomerApi.PlanParams;
  }

  export interface CaseForm {
    accidentPicture?: string;
    address?: string;
    addressPicture?: string;
    bxbm?: number | string;
    cardPicture?: string;
    casenoInsuredAttach?: string;
    casenoInsuredMain?: string;
    city?: string;
    cityCode?: string;
    companyId?: number | string;
    companyName?: string;
    creditcard?: string;
    details?: string;
    diseasePicture?: string;
    district?: string;
    districtCode?: string;
    fujiaxian?: string;
    goodPicture?: string;
    id?: number | string;
    insureTime?: number | string;
    insureType?: number | string;
    insuredAttach?: number | string;
    insuredAttachName?: string;
    insuredMain?: number | string;
    insuredMainName?: string;
    modifyPicture?: string;
    name?: string;
    orderPicture?: string;
    oritext?: string;
    otherPicture?: string;
    owner?: number | string;
    phone?: string;
    phoneOwner?: string;
    policyNo?: string;
    policyNoAttach?: string;
    province?: string;
    provinceCode?: string;
    stopId?: number | string;
    stopName?: string;
    stopOwner?: string;
    stopOwnerName?: string;
    stopOwnerPhone?: string;
    ticketPicture?: string;
    zeren?: number | string;
    caseArea?: string[];
    created?: number | string;
    lipeiPerson?: number | string;
    username?: string;
    usernameOwner?: string;
  }

  export interface CommentInfo {
    accidentPicture?: string;
    addressPicture?: string;
    beizhu?: string;
    cardPicture?: string;
    caseId?: number | string;
    content?: string;
    diseasePicture?: string;
    goodPicture?: string;
    lipeiPerson?: number | string;
    modifyPicture?: string;
    moneyAttach?: number | string;
    moneyDianfu?: number | string;
    moneyMain?: number | string;
    orderPicture?: string;
    otherPicture?: string;
    status?: number | string;
    ticketPicture?: string;
    timeContactNext?: number | string;
    wayContact?: number | string;
    zeren?: number | string;
    id?: number | string;
  }

  export interface CaseMoney {
    caseId?: string; // 案件id，可选
    created?: string; // 创建日期，可选
    daysCheck?: number; // 核算天数，可选（注意：TypeScript中使用number而不是integer）
    daysMianpei?: number; // 免赔天数，可选
    id?: number; // 标识符，可选
    isqishou?: number; // 1骑手明细 2三者明细，可选
    moneryAttach?: number; // 附加险金额，可选
    moneryMain?: number; // 主险金额，可选
    type?: number; // 类型（详见下方注释），可选
    uid?: string; // 创建人，可选
    uidUpdate?: string; // 修改人，可选
    updated?: string; // 修改日期，可选
    username?: string; // 创建人昵称，可选
    usernameUpdate?: string; // 修改人昵称，可选
  }
}

/**
 * 获取案件列表接口
 */
export async function CaseListApi(
  data: CaseApi.PageData,
  params: CaseApi.PageParams,
) {
  return requestClient.post<CaseApi.ListResult>('/case/list', data, {
    params,
  });
}

/**
 * 添加案件接口
 */
export async function CaseAddApi(data: CaseApi.CaseData) {
  return requestClient.post<CaseApi.CaseResult>('/case/add', data);
}

/**
 * 更新案件接口
 */
export async function CaseUpdateApi(data: CaseApi.CaseDetail) {
  return requestClient.post<CaseApi.CaseResult>('/case/update', data);
}

/**
 * 获取案件详情接口
 */
export async function CaseGetApi(id: number | string) {
  return requestClient.get<CaseApi.CaseDetail>('/case/get', {
    params: { id },
  });
}

/**
 * 通过身份证获取人员信息接口
 */
export async function CaseCardGetApi(cardNo: number | string) {
  return requestClient.get<CaseApi.CardData>('/case/card/get', {
    params: { cardNo },
  });
}

/**
 * 获取案件沟通记录接口
 */
export async function CaseCommentGetApi(
  caseId: number | string,
  page: number,
  size: number,
) {
  return requestClient.get<CaseApi.CardData>('/case/comment/list', {
    params: { caseId, page, size },
  });
}

/**
 * 添加案件沟通记录接口
 */
export async function CaseCommentAddApi(data: CaseApi.CommentInfo) {
  return requestClient.post<CaseApi.CaseResult>('/case/comment/add', data);
}

/**
 * 重开案件接口
 */
export async function CaseReopenApi(id: number | string, reason: string) {
  return requestClient.post<CaseApi.CaseResult>(
    '/case/reopen',
    {},
    { params: { id, reason } },
  );
}

/**
 * 重开记录接口
 */
export async function CaseReopenLogApi(page: number, size: number) {
  return requestClient.get<CaseApi.ListResult>('/case/log/reopen/list', {
    params: { page, size },
  });
}

/**
 * 案件日志接口
 */
export async function CaseLogApi(
  caseId: number | string,
  page: number,
  size: number,
) {
  return requestClient.get<CaseApi.ListResult>('/case/log/list', {
    params: { caseId, page, size },
  });
}

/**
 * 案件赔付记录接口
 */
export async function CaseMoneyListApi(caseId: number | string, type: 1 | 2) {
  return requestClient.get<CaseApi.ListResult>('/case/money/list', {
    params: { caseId, type },
  });
}

/**
 * 添加案件赔付记录接口
 */
export async function CaseMoneyAddApi(
  caseId: number | string,
  data: CaseApi.CaseMoney[],
) {
  return requestClient.post<CaseApi.CaseResult>('/case/money/add', data, {
    params: { caseId },
  });
}

/**
 * 更新案件赔付记录接口
 */
export async function CaseMoneyUpdateApi(
  caseId: number | string,
  data: CaseApi.CaseMoney[],
) {
  return requestClient.post<CaseApi.CaseResult>('/case/money/update', data, {
    params: { caseId },
  });
}
