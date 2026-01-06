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
}

export interface TbCaseZt {
  comments?: string;
  phone?: string;
  username?: string;
  zt?: string;
  id?: number | string;
}

export interface TbCaseWithBLOBs {
  accidentPicture?: string;
  accidentTime?: string;
  address?: string;
  addressPicture?: string;
  bbCard?: string;
  bbCardAttach?: string;
  bbr?: string;
  bbrAttach?: string;
  bbrCardtype?: number;
  bbrCardtypeAttach?: number;
  beginTime?: string;
  bxbm?: string;
  cardPicture?: string;
  casenoInsuredAttach?: string;
  casenoInsuredMain?: string;
  channelId?: string;
  channelName?: string;
  city?: string;
  cityCode?: string;
  closeTime?: string;
  companyAttach?: string;
  companyId?: string;
  companyMain?: string;
  companyName?: string;
  contactTime?: string;
  contactTimeLast?: string;
  cosed?: number;
  created?: string;
  creditcard?: string;
  creditcardRep?: string;
  cuibanTag?: number;
  cuibanTimeout?: number;
  customerId?: string;
  customerName?: string;
  details?: string;
  diseasePicture?: string;
  district?: string;
  districtCode?: string;
  endTime?: string;
  exceptionTag?: number;
  exceptionType?: string;
  fengxian?: number;
  fengxianTag?: number;
  files?: TbCaseFiles[];
  fujiaxian?: string;
  goodPicture?: string;
  guaqiTag?: number;
  guaqiType?: string;
  id?: number;
  insureTime?: string;
  insureType?: number;
  insuredAttach?: string;
  insuredAttachName?: string;
  insuredMain?: string;
  insuredMainName?: string;
  lipeiPerson?: number;
  lockTime?: string;
  modifyPicture?: string;
  moneyAttach?: number;
  moneyDianfu?: number;
  moneyMain?: number;
  name?: string;
  nameRep?: string;
  orderPicture?: string;
  oritext?: string;
  otherPicture?: string;
  owner?: string;
  ownerName?: string;
  phone?: string;
  phoneOwner?: string;
  phoneRep?: string;
  photo?: string;
  photoOwner?: string;
  policyNo?: string;
  policyNoAttach?: string;
  province?: string;
  provinceCode?: string;
  shougong?: number;
  status?: number;
  stayTime?: string;
  stopId?: string;
  stopName?: string;
  stopOwner?: string;
  stopOwnerName?: string;
  stopOwnerPhone?: string;
  tbCard?: string;
  tbCardAttach?: string;
  tbr?: string;
  tbrAttach?: string;
  tbrCardtype?: number;
  tbrCardtypeAttach?: number;
  ticketPicture?: string;
  timeout?: number;
  tl?: string;
  updated?: string;
  userid?: string;
  useridUpdate?: string;
  username?: string;
  usernameOwner?: string;
  usernameUpdate?: string;
  uuid?: string;
  version?: number;
  zeren?: number;
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
  },
) {
  return requestClient.post<{ list: TbCaseWithBLOBs[]; total: number }>(
    '/record/case/list',
    groupInfo,
    { params },
  );
}
