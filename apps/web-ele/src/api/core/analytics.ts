import { requestClient } from '#/api/request';

export namespace TaskApi {
  /** 操作成功返回值 */
  export interface TaskResult {
    result: number | string;
  }

  export interface AnalyticsParams {
    begintime: number | string;
    endtime: number | string;
  }

  export interface OrderAnalyticsParams extends AnalyticsParams {
    orderid?: string;
  }

  export interface ListResult {
    list: any[];
    total: number;
  }

  export interface AnalyticsResult {
    result: number;
  }
}

/**
 * 生效订单数和所有订单数
 */
export async function getOrderAnalytics(tag?: number) {
  return requestClient.get('/tj/order', { params: { tag } });
}

/**
 * 获取历史订单总骑手数
 */
export async function getRiderHistoryCountAnalytics() {
  return requestClient.get('/tj/order/member/all');
}

/**
 * 获取订单每日在保人数统计
 */
export async function getRiderOrderDailyActiveAnalytics(
  params: TaskApi.OrderAnalyticsParams,
) {
  return requestClient.get<TaskApi.ListResult>('/tj/order/member/day', {
    params,
  });
}

/**
 * 获取所有订单在保骑手数
 */
export async function getRiderCountAnalytics() {
  return requestClient.get('/tj/order/member/zb');
}

/**
 * 获取生效站点和总站点数
 */
export async function getStationAnalytics(tag?: number) {
  return requestClient.get('/tj/stop', { params: { tag } });
}

/**
 * 获取用户每日在保人数统计
 */
export async function getRiderDailyActiveAnalytics(
  params: TaskApi.AnalyticsParams,
) {
  return requestClient.get('/tj/user/member/day', { params });
}
