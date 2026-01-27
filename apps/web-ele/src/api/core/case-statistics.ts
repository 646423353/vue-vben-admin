import { requestClient } from '#/api/request';

export namespace CaseStatisticsApi {
  export interface TbCaseTjMonth {
    cc?: number; // 案件数
    created?: string;
    id?: number;
    months?: string; // 月份
    updated?: string;
  }

  export interface TbCaseTjPerson {
    cc?: number; // 待处理案件数
    ccExcept?: number; // 异常案件数
    created?: string;
    id?: number;
    uid?: string; // 人员编号
    updated?: string;
    username?: string; // 昵称
  }

  export interface PersonChartListParams {
    page: number;
    size: number;
  }

  export interface PageInfo<T> {
    list: T[];
    total: number;
    pageNum: number;
    pageSize: number;
  }
}

/**
 * Get monthly chart data
 */
export async function getMonthlyChartDataApi() {
  return requestClient.get<CaseStatisticsApi.TbCaseTjMonth[]>(
    '/record/tj/charts/month',
  );
}

/**
 * Get person chart data
 */
export async function getPersonChartDataApi(
  params: CaseStatisticsApi.PersonChartListParams,
) {
  return requestClient.get<
    CaseStatisticsApi.PageInfo<CaseStatisticsApi.TbCaseTjPerson>
  >('/record/tj/charts/person', { params });
}
