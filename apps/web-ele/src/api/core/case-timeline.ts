import { requestClient } from '#/api/request';

/**
 * 案件便签/时间轴实体
 */
export interface TbCaseUserTimeline {
  caseId?: number;
  cid?: number; // 保司沟通记录id
  durationTime?: number; // 持续时间
  fid?: number; // 最终赔付记录id
  file?: string; // 头像链接
  id?: number;
  lastUser?: string; // 上一个处理人
  lastUsername?: string; // 上一个处理人昵称
  lockTime?: string; // 锁定时间
  nickname?: string; // 昵称
  pid?: number; // 赔付沟通记录id
  remark?: string; // 便签备注
  roleId?: number;
  roleName?: string; // 角色名称
  startTime?: string; // 开始时间
  timeout?: number; // 0未超时 1已超时 2严重超时
  unlockTime?: string; // 结束时间
  updateTime?: string; // 最近对接更新
  userId?: number;
  [key: string]: any;
}

export interface TimelineListParams {
  page?: number;
  size?: number;
  id?: number | string; // 案件id
}

/**
 * 查询案件的所有便签
 */
export async function getTimelineListApi(params: TimelineListParams) {
  return requestClient.get<{
    list: TbCaseUserTimeline[];
    pageNum?: number;
    pageSize?: number;
    total: number;
  }>('/timeline/list', {
    params,
  });
}

/**
 * 修改便签备注(保存草稿)
 */
export async function updateTimelineApi(params: {
  id: number | string;
  remark: string;
}) {
  return requestClient.post('/timeline/update', null, {
    params,
  });
}

/**
 * 便签修改历史记录实体
 */
export interface TbCaseUserTimelineDeal {
  caseId?: string; // 案件id
  comments?: string; // 备注
  created?: string; // 操作时间
  id?: number;
  method?: string; // 操作类型
  nowvalue?: string; // 修改后值
  orivalue?: string; // 原来值
  timelinId?: string; // 便签id
  uid?: string; // 操作人id
}

/**
 * 获取便签修改历史
 */
export async function getTimelineDealApi(params: {
  id: number | string; // 便签id
  page?: number;
  size?: number;
}) {
  return requestClient.get<{
    list: TbCaseUserTimelineDeal[];
    pageNum?: number;
    pageSize?: number;
    total: number;
  }>('/timeline/case/get', {
    params,
  });
}
