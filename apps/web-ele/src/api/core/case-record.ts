import type { CaseApi } from '#/api/core/case';

import { requestClient } from '#/api/request';

export interface TbCaseFiles {
  cateId?: string;
  cateName?: string;
  comments?: string;
  fileSize?: string;
  title?: string;
  url?: string;
  id?: number | string;
  created?: number | string;
}

export interface TbCaseZt {
  comments?: string;
  phone?: string;
  username?: string;
  zt?: string;
  id?: number | string;
}

export interface TbCaseWithBLOBs {
  /** 事故认定书 */
  accidentPicture?: string;
  /** 事故时间 */
  accidentTime?: string;
  /** 地址 */
  address?: string;
  /** 现场照片 */
  addressPicture?: string;
  /** 主险被保人证件号 */
  bbCard?: string;
  /** 附加险被保人证件号 */
  bbCardAttach?: string;
  /** 主险被保人名称 */
  bbr?: string;
  /** 附加险被保人名称 */
  bbrAttach?: string;
  /** 主险被保人证件类型 0身份证 1 企业信用代码 */
  bbrCardtype?: number;
  /** 附加险被保人证件类型 0身份证 1 企业信用代码 */
  bbrCardtypeAttach?: number;
  /** 起保日期 */
  beginTime?: string;
  /** 保险编码 */
  bxbm?: string;
  /** 身份证照片 */
  cardPicture?: string;
  /** 附加险报案号 */
  casenoInsuredAttach?: string;
  /** 主险报案号 */
  casenoInsuredMain?: string;
  /** 渠道id */
  channelId?: string;
  /** 渠道名 */
  channelName?: string;
  /** 市 */
  city?: string;
  /** 市编码 */
  cityCode?: string;
  /** 结案时间 */
  closeTime?: string;
  /** 附加险保险公司 */
  companyAttach?: string;
  /** 所属公司 */
  companyId?: string;
  /** 主险保险公司 */
  companyMain?: string;
  /** 所属公司名称 */
  companyName?: string;
  /** 首次沟通时间 */
  contactTime?: string;
  /** 上次沟通日期 */
  contactTimeLast?: string;
  /** 0未结案 1已结案 */
  cosed?: number;
  /** 创建日期 */
  created?: string;
  /** 身份证号 */
  creditcard?: string;
  /** 报案人身份证号 */
  creditcardRep?: string;
  /** 0 未催办 1有催办 */
  cuibanTag?: number;
  /** 催办超时1 催办未超时0 */
  cuibanTimeout?: number;
  /** 客户id */
  customerId?: string;
  /** 客户名称 */
  customerName?: string;
  /** 详情 */
  details?: string;
  /** 病例资料 */
  diseasePicture?: string;
  /** 区 */
  district?: string;
  /** 区编码 */
  districtCode?: string;
  /** 终保日期 */
  endTime?: string;
  /** 异常标记 0非异常 1异常 */
  exceptionTag?: number;
  /** 异常类型 */
  exceptionType?: string;
  /** 风险标签数 */
  fengxian?: number;
  /** 0无风险 1有风险 */
  fengxianTag?: number;
  /** 相关照片和文件 */
  files?: TbCaseFiles[];
  /** 有无附加险 0无1有 */
  fujiaxian?: string;
  /** 物损照片 */
  goodPicture?: string;
  /** 挂起标记 0未挂起 1挂起 */
  guaqiTag?: number;
  /** 挂起类型 */
  guaqiType?: string;
  id?: number | string;
  /** 出险时间 */
  insureTime?: string;
  /** 1自身受伤 2三者受伤 3三者物损 */
  insureType?: number;
  /** 附加险 */
  insuredAttach?: string;
  /** 附加险名称 */
  insuredAttachName?: string;
  /** 主险 */
  insuredMain?: string;
  /** 主险名称 */
  insuredMainName?: string;
  /** 理赔对象 0骑手 1公司 2三者 */
  lipeiPerson?: number;
  /** 处理人开始时间 */
  lockTime?: string;
  /** 修理照片 */
  modifyPicture?: string;
  /** 附加险赔付金额 */
  moneyAttach?: number;
  /** 垫付金额 */
  moneyDianfu?: number;
  /** 主险赔付金额 */
  moneyMain?: number;
  /** 姓名 */
  name?: string;
  /** 报案人姓名 */
  nameRep?: string;
  /** 订单截图 */
  orderPicture?: string;
  /** 原始字符串 */
  oritext?: string;
  /** 其他照片 */
  otherPicture?: string;
  /** 理赔员id,当前处理人id */
  owner?: string;
  /** 当前处理人名称 */
  ownerName?: string;
  /** 手机号 */
  phone?: string;
  /** 理赔员手机号 */
  phoneOwner?: string;
  /** 报案人手机号 */
  phoneRep?: string;
  /** 创建人头像 */
  photo?: string;
  /** 理赔员头像 */
  photoOwner?: string;
  /** 主险保单号 */
  policyNo?: string;
  /** 附加险保单号 */
  policyNoAttach?: string;
  /** 省份 */
  province?: string;
  /** 省编码 */
  provinceCode?: string;
  /** 案件录入情况：0匹配保单录入 1手工录入 */
  shougong?: number;
  /** 案件状态 */
  status?: number;
  /** 滞留时间 */
  stayTime?: string;
  /** 站点id */
  stopId?: string;
  /** 站点名称 */
  stopName?: string;
  /** 站长id */
  stopOwner?: string;
  /** 站长名称 */
  stopOwnerName?: string;
  /** 站长手机号 */
  stopOwnerPhone?: string;
  /** 投保人证件号 */
  tbCard?: string;
  /** 附加险投保人证件号 */
  tbCardAttach?: string;
  /** 投保人名称 */
  tbr?: string;
  /** 附加险投保人名称 */
  tbrAttach?: string;
  /** 投保人证件类型 0身份证 1 企业信用代码 */
  tbrCardtype?: number;
  /** 附加险投保人证件类型 0身份证 1 企业信用代码 */
  tbrCardtypeAttach?: number;
  /** 发票照片 */
  ticketPicture?: string;
  /** 案件总用时状态 */
  timeout?: number;
  /** 便签id */
  tl?: string;
  /** 修改日期 */
  updated?: string;
  /** 案件创建人 */
  userid?: string;
  /** 最近修改人 */
  useridUpdate?: string;
  /** 案件创建人名称 */
  username?: string;
  /** 理赔员昵称 */
  usernameOwner?: string;
  /** 最近修改人名称 */
  usernameUpdate?: string;
  /** 案件号 */
  uuid?: string;
  version?: number;
  /** 1全责 2主责 3次责 4同责 5无责 6 摔伤 */
  zeren?: number;
  /** 关联主体 */
  zts?: TbCaseZt[];
  [key: string]: any;
}

/**
 * 新增案件接口 (GroupInfo flattened)
 */
export async function CaseRecordAddApi(data: TbCaseWithBLOBs) {
  return requestClient.post<string>('/record/case/add', data);
}

/**
 * 更新案件接口 (GroupInfo flattened)
 */
export async function CaseRecordUpdateApi(data: TbCaseWithBLOBs) {
  return requestClient.post<CaseApi.CaseResult>('/record/case/update', data);
}

/**
 * 获取案件详情接口
 */
export async function CaseRecordGetApi(id: number | string) {
  return requestClient.get<TbCaseWithBLOBs>('/record/case/get', {
    params: { id },
  });
}

/**
 * 获取案件列表接口
 */
export async function CaseRecordListApi(
  groupInfo: TbCaseWithBLOBs,
  params: {
    anjianBeginTime?: number | string;
    anjianEndTime?: number | string;
    beginTime?: number | string;
    endTime?: number | string;
    page?: number;
    size?: number;
    status?: string;
    type?: number;
  },
) {
  return requestClient.post<{ list: TbCaseWithBLOBs[]; total: number }>(
    '/record/case/list',
    groupInfo,
    { params },
  );
}

/**
 * 锁定案件接口
 */
export async function CaseRecordLockApi(id: string) {
  return requestClient.post<any>('/record/case/lock', {}, { params: { id } });
}

/**
 * 解锁案件接口
 */
export async function CaseRecordUnlockApi(id: string, command?: string) {
  return requestClient.post<any>(
    '/record/case/unlock',
    {},
    { params: { id, command } },
  );
}

/**
 * 退回上一处理人
 */
/**
 * 退回上一处理人
 */
export async function caseRecordBackApi(params: {
  caseId: string;
  command?: string;
  reason: string;
}) {
  return requestClient.post<any>('/record/case/back', null, { params });
}

/**
 * 挂起
 */
export async function caseRecordBlockApi(params: {
  caseId: string;
  command?: string;
  reason: string;
}) {
  return requestClient.post<any>('/record/case/blcok', null, { params });
}

/**
 * 结案
 */
export async function caseRecordCloseApi(params: {
  caseId: string;
  command?: string;
  reason: string;
}) {
  return requestClient.post<any>('/record/case/close', null, { params });
}

/**
 * 转异常
 */
export async function caseRecordExceptionApi(params: {
  caseId: string;
  command?: string;
  reason: string;
}) {
  return requestClient.post<any>('/record/case/exception', null, { params });
}

/**
 * 案件日志接口结构
 */
export interface TbCaseLog {
  caseId?: string;
  content?: string;
  created?: string;
  id?: number;
  photo?: string;
  reason?: string;
  reopenTag?: number;
  timelinId?: string;
  uid?: string;
  username?: string;
}

export interface LogListResult {
  list: TbCaseLog[];
  total: number;
}

/**
 * 案件日志接口
 */
export async function CaseLogApi(
  caseId: number | string,
  page: number,
  size: number,
) {
  return requestClient.get<LogListResult>('/case/log/list', {
    params: { caseId, page, size },
  });
}
/**
 * 转派处理人接口 (Lipei Update)
 */
export async function updateLipeiApi(params: {
  caseId: string;
  command: string;
  ownerId: string;
  phoneOwner?: string;
}) {
  return requestClient.post<any>('/record/case/lipei/update', null, { params });
}
