import { requestClient } from '#/api/request';

export namespace CaseReminderApi {
  export interface TbCaseCuiban {
    caseId?: string; // 案件id，多个以逗号隔开
    comments?: string; // 备注
    commentsBack?: string; // 最近驳回备注
    commentsFeedback?: string; // 最近反馈备注
    created?: string; // 创建日期
    dateBack?: string; // 最近驳回时间
    dtFeedback?: string; // 最近反馈时间
    endTime?: string; // 截止日期
    id?: number; // 催办记录id
    imp?: number; // 重要程度*：普通1、高2、最高3
    receiver?: number; // 接收人id
    receiverName?: string; // 接收人昵称
    status?: number; // 1正常 0删除
    statusClose?: string; // 0未解决 1已解决
    statusFeedback?: number; // 未反馈0 已反馈1
    statusTime?: number; // 未超时0 超时1 严重超时2
    summerys?: string; // 备用
    type?: number; // 催办事件类型：可多选也可不选：加速定损1、尽快联系骑手2、尽快联系保司3、加快案件处理4,多个以逗号隔开
    uid?: string; // 创建人编号
    uidModify?: string; // 最后修改人编号
    username?: string; // 创建人创建时候的昵称
    usernameQs?: string; // 骑手姓名(逗号隔开)
    zt?: string; // 催办内容
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

  export interface ReminderListParams {
    page?: number; // 页码
    size?: number; // 每页数量
    receiver?: string; // 接收人id，可为空
    caseId?: string; // 案件id，可为空
    type?: string; // 类型，1创建的2接收的3类型过滤可不选；如要过滤条件12创建的且类型是加速定损,以逗号隔开
  }

  export interface CreateReminderParams {
    caseId?: string; // 案件id，多个以逗号隔开
    comments?: string; // 备注
    endTime: string; // 截止日期（必填）
    imp: number; // 重要程度：普通1、高2、最高3（必填）
    receiver: number; // 接收人id（必填）
    type?: string; // 催办事件类型：加速定损1、尽快联系骑手2、尽快联系保司3、加快案件处理4,多个以逗号隔开
    zt: string; // 催办内容（必填）
  }
}

/**
 * Get reminder list
 */
export async function getReminderListApi(
  params: CaseReminderApi.ReminderListParams,
) {
  return requestClient.get<
    CaseReminderApi.PageInfo<CaseReminderApi.TbCaseCuiban>
  >('/record/cb/list', { params });
}

/**
 * Create new reminder
 */
export async function createReminderApi(
  params: CaseReminderApi.CreateReminderParams,
) {
  return requestClient.post('/record/cb/add', params);
}

/**
 * Submit feedback
 */
export async function submitReminderFeedbackApi(params: {
  commentsFeedback: string;
  cuibanId: number;
}) {
  return requestClient.post('/record/cb/feedback/add', params);
}

/**
 * Confirm resolved (close case)
 */
export async function confirmReminderResolvedApi(fbId: number) {
  return requestClient.post('/record/cb/feedback/close', null, {
    params: { fbId },
  });
}

/**
 * Reject feedback
 */
export async function rejectReminderFeedbackApi(params: {
  comments: string;
  fbId: number;
}) {
  return requestClient.post('/record/cb/feedback/back', null, {
    params,
  });
}

/**
 * Increase importance
 */
export async function increaseReminderImportanceApi(params: {
  id: number;
  imp: number;
}) {
  return requestClient.post('/record/cb/update', params);
}

/**
 * Get feedback list
 */
export async function getFeedbackListApi(cbId: string) {
  return requestClient.get('/record/cb/feedback/list', {
    params: {
      page: 1,
      size: 20,
      cbId,
    },
  });
}
