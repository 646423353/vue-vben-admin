import { requestClient } from '#/api/request';

export namespace CaseReminderRuleApi {
  export interface TbCaseSettingCb {
    comments?: string; // 备注 (Mapping to reminderText)
    created?: string; // 创建日期
    funct?: string; // 计算公式
    id?: number; // 规则id
    imp?: number; // 重要程度 普通0 高1 最高2
    readme?: string; // 说明 (Mapping to description)
    status?: number; // 1正常 0 删除 2失效
    stopHour?: number; // 截止日期, 几小时
    title?: string; // 规则名称
    type?: string; // 催办类型, 多选。同手工催办, 逗号隔开 (e.g., "1,2")
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

  export interface ReminderRuleListParams {
    page?: number;
    size?: number;
  }
}

/**
 * Get reminder rule list
 */
export async function getReminderRuleListApi(
  params: CaseReminderRuleApi.ReminderRuleListParams,
) {
  return requestClient.get<
    CaseReminderRuleApi.PageInfo<CaseReminderRuleApi.TbCaseSettingCb>
  >('/record/cb/rules/rules', { params });
}

/**
 * Add reminder rule
 */
export async function addReminderRuleApi(
  rule: CaseReminderRuleApi.TbCaseSettingCb,
) {
  return requestClient.post('/record/cb/rules/add', rule);
}

/**
 * Update reminder rule
 */
export async function updateReminderRuleApi(
  rule: CaseReminderRuleApi.TbCaseSettingCb,
) {
  return requestClient.post('/record/cb/rules/update', rule);
}

/**
 * Delete reminder rule
 */
export async function delReminderRuleApi(id: number) {
  return requestClient.post('/record/cb/rules/del', null, {
    params: { id },
  });
}
