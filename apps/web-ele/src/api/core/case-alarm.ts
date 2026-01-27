import { requestClient } from '#/api/request';

export namespace CaseAlarmApi {
  export interface TbCaseSettingRules {
    comments?: string;
    funct?: string;
    id?: number;
    title?: string;
    status?: number; // 1启用 0停用
  }

  export interface PageInfo<T> {
    endRow?: number;
    firstPage?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    isFirstPage?: boolean;
    isLastPage?: boolean;
    lastPage?: number;
    list?: T[];
    navigatePages?: number;
    navigatepageNums?: number[];
    nextPage?: number;
    orderBy?: string;
    pageNum?: number;
    pageSize?: number;
    pages?: number;
    prePage?: number;
    size?: number;
    startRow?: number;
    total?: number;
  }

  export interface RiskRuleAddParams {
    comments?: string;
    funct?: string;
    title?: string;
    status?: number;
  }

  export interface RiskRuleUpdateParams extends RiskRuleAddParams {
    id: number;
  }

  export interface RiskRuleQueryParams {
    page?: number;
    size?: number;
  }

  export interface TbCaseYujing {
    caseId?: string;
    comments?: string;
    created?: string;
    id?: number;
    ruleId?: number;
    rules?: string;
    status?: number;
    summerys?: string;
    uid?: string;
    uidModify?: string;
    zt?: string;
  }

  export interface CaseAlarmListParams {
    page?: number;
    size?: number;
    caseId?: string;
  }

  export interface TbCaseAlarmPara {
    caseCountHistory?: number; // 骑手历史案件数
    caseCountHistoryLipei?: number; // 历史获赔案件数
    caseId?: string;
    caseMoneyHistoryLipei?: number; // 历史获赔金额
    created?: string; // 创建日期
    id?: number;
    money?: number; // 本案获赔金额
    remark?: string; // 备注
    tbBeginTime?: string; // 最早报案日期
    tbBeginTimeRecent?: string; // 最近报案日期
    tbCount?: number; // 骑手历史总报案次数
    tbDays?: number; // 最近报案距今天数
    tbDaysAccident?: number; // 出险日期前30天报案天数
    tbDaysAfterAccident?: number; // 出险日期后30天报案天数（截止到提案件）
    times?: number; // 报案时效，创建时间-出险时间，差距，单位为小时
    timesAverage?: number; // 平均报案时效（不含当前）
  }
}

/**
 * Get particular case risk warning list
 */
export async function getCaseAlarmListApi(
  params: CaseAlarmApi.CaseAlarmListParams,
) {
  return requestClient.get<CaseAlarmApi.PageInfo<CaseAlarmApi.TbCaseYujing>>(
    '/record/alarm/list',
    { params },
  );
}

/**
 * Get risk warning rules list
 */
export async function getRiskRulesApi(
  params: CaseAlarmApi.RiskRuleQueryParams,
) {
  return requestClient.get<
    CaseAlarmApi.PageInfo<CaseAlarmApi.TbCaseSettingRules>
  >('/record/alarm/rules', { params });
}

/**
 * Add risk warning rule
 */
export async function addRiskRuleApi(rule: CaseAlarmApi.RiskRuleAddParams) {
  return requestClient.post('/record/alarm/add', rule);
}

/**
 * Update risk warning rule
 */
export async function updateRiskRuleApi(
  rule: CaseAlarmApi.RiskRuleUpdateParams,
) {
  return requestClient.post('/record/alarm/update', rule);
}

/**
 * Delete risk warning rule
 */
export async function deleteRiskRuleApi(id: number) {
  return requestClient.post('/record/alarm/del', {}, { params: { id } });
}

/**
 * Get case alarm parameters (basic risk情况)
 */
export async function getCaseAlarmParasApi(caseId: string) {
  return requestClient.get<CaseAlarmApi.TbCaseAlarmPara>(
    '/record/alarm/paras',
    {
      params: { caseId },
    },
  );
}
