import { requestClient } from '#/api/request';

export interface TbCaseCommentDto {
  id?: number;
  attatchs?: string;
  beizhu?: string;
  caseId?: number | string;
  company?: string;
  content?: string;
  email?: string;
  lipei?: string;
  method?: number;
  phone?: string;
  policyNo?: string;
  type?: string;
}

export interface TbCaseComment extends TbCaseCommentDto {
  id: number;
  caseId: number | string;
  createTime?: string;
  updateTime?: string;
}

export interface CaseCommentListParams {
  page?: number;
  size?: number;
  caseId: number | string;
  maxId?: string;
}

/**
 * Add a new case comment (docking record)
 */
export async function addCaseCommentApi(groupInfo: TbCaseCommentDto) {
  return requestClient.post('/duijie/case/comment/add', groupInfo);
}

/**
 * Update existing case comment (docking record)
 */
export async function updateCaseCommentApi(groupInfo: TbCaseCommentDto) {
  return requestClient.post('/duijie/case/comment/update', groupInfo);
}

/**
 * Get case comment list
 */
export async function getCaseCommentListApi(params: CaseCommentListParams) {
  return requestClient.get<{
    list: TbCaseComment[];
    total: number;
  }>('/duijie/case/comment/list', { params });
}

export interface TbCaseCommentPost {
  id?: number | string;
  attatchs?: string;
  beizhu?: string;
  commentId?: number | string; // 对应对接表ID (record.id)
  content?: string;
  method?: number; // 动作 1-7
  created?: number | string;
}

/**
 * Get docking post list (actions within a docking record)
 */
export async function getCaseCommentPostListApi(params: {
  page?: number;
  size?: number;
  tid: number | string;
}) {
  return requestClient.get<{
    list: TbCaseCommentPost[];
    total: number;
  }>('/duijie/case/comment/post/list', { params });
}

/**
 * Add a new docking post (action)
 */
export async function addCaseCommentPostApi(group: TbCaseCommentPost) {
  return requestClient.post('/duijie/case/comment/post/add', group);
}
