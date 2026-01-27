import { requestClient } from '#/api/request';

export namespace CaseStatisticsRuleApi {
  export interface TbCaseSettingTj {
    comments?: string; // 展示样式 (Mapping to displayStyle)
    created?: string; // 创建日期
    funct?: string; // 计算公式
    id?: number; // 规则id
    readme?: string; // 说明 (Mapping to description)
    status?: number; // 1正常 0 删除 2失效
    title?: string; // 规则名称 (Mapping to name)
    uid?: string; // 创建人编号
    uidModify?: string; // 最后修改人编号
    uuid?: string;
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

  export interface StatisticRuleListParams {
    page?: number;
    size?: number;
  }
}

/**
 * Get statistic rule list
 */
export async function getStatisticRuleListApi(
  params: CaseStatisticsRuleApi.StatisticRuleListParams,
) {
  return requestClient.get<
    CaseStatisticsRuleApi.PageInfo<CaseStatisticsRuleApi.TbCaseSettingTj>
  >('/record/tj/rules', { params });
}

/**
 * Add statistic rule
 */
export async function addStatisticRuleApi(
  rule: CaseStatisticsRuleApi.TbCaseSettingTj,
) {
  return requestClient.post('/record/tj/add', rule);
}

/**
 * Update statistic rule
 */
export async function updateStatisticRuleApi(
  rule: CaseStatisticsRuleApi.TbCaseSettingTj,
) {
  return requestClient.post('/record/tj/update', rule);
}

/**
 * Delete statistic rule
 */
export async function delStatisticRuleApi(id: number) {
  return requestClient.post('/record/tj/del', null, {
    params: { id },
  });
}
