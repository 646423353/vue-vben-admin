import { requestClient } from '#/api/request';

export namespace CaseMoneyApi {
  export interface TbCaseMoney {
    caseId?: string;
    cate?: number;
    catename?: string;
    cmId?: number;
    comments?: string;
    created?: string;
    csYiju?: string;
    daysCheck?: number;
    daysMianpei?: number;
    gongshi?: string;
    id?: number;
    isqishou?: number;
    moneryAttach?: number;
    moneryHope?: number;
    moneryMain?: number;
    pics?: string;
    type?: number;
    typename?: string;
    uid?: string;
    uidUpdate?: string;
    updated?: string;
    username?: string;
    usernameUpdate?: string;
    yiju?: string;
    zt?: string;
    ztName?: string;
  }

  export interface TbCaseMoneyCate {
    cate?: string;
    cmId?: number;
    comments?: string;
    created?: string;
    id?: number;
    items?: TbCaseMoney[];
    money?: string;
    name?: string;
    status?: number;
    username?: string;
    ztId?: string;
    ztName?: string;
  }

  export interface TbCaseMoneyDetails {
    caseId?: string;
    created?: string;
    dsId?: string;
    id?: number | string;
    items?: TbCaseMoney[];
    panding?: string;
    pdf?: string;
    remark?: string;
    status?: number;
    types?: string;
    weizhang?: string;
    zeren?: string;
    zts?: TbCaseMoneyCate[];
    [key: string]: any;
  }

  export interface MoneyDto {
    details?: TbCaseMoneyDetails;
    id?: number | string;
    items?: TbCaseMoney[];
  }

  export interface DingsunResult {
    code: number;
    message: string;
    result: any;
    success: boolean;
    timestamp: number;
  }
}

/**
 * 添加/更新定损 (Add/Update Loss Assessment)
 */
export async function DingsunMoneyAddApi(data: CaseMoneyApi.MoneyDto) {
  return requestClient.post<CaseMoneyApi.DingsunResult>(
    '/dingsun/money/add',
    data,
  );
}

/**
 * 查询定损 (Get Loss Assessment)
 */
export async function DingsunMoneyGetApi(id: number | string) {
  return requestClient.get<CaseMoneyApi.TbCaseMoneyDetails>(
    '/dingsun/money/get',
    {
      params: { id },
    },
  );
}

/**
 * 更新定损 (Update Loss Assessment)
 */
export async function DingsunMoneyUpdateApi(data: CaseMoneyApi.MoneyDto) {
  return requestClient.post<CaseMoneyApi.DingsunResult>(
    '/dingsun/money/update',
    data,
  );
}
