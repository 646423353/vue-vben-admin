import { requestClient } from '#/api/request';

/**
 * 赔付沟通表
 */
export interface TbCasePeifu {
  attatchs?: string;
  beizhu?: string;
  caseId?: number | string;
  content?: string;
  id?: number | string;
  method?: number;
  zt?: string;
  ztName?: string;
  ztPhone?: string;
  ztUsername?: string;
  createTime?: string;
  updateTime?: string;
}

export interface TbCasePeifuPost {
  attatchs?: string;
  beizhu?: string;
  content?: string;
  created?: number | string;
  id?: number | string;
  method?: number; // 动作 (单选) 初步协商一致1、协商异常2、协商一致3、无法联系4、其他情况5
  peifuId?: number | string; // 赔付沟通表id
}

/**
 * Get Peifu Main List
 */
export async function getCasePeifuListApi(params: {
  caseId: number | string;
  maxId?: string;
  page?: number;
  size?: number;
}) {
  return requestClient.get<{
    list: TbCasePeifu[];
    total: number;
  }>('/peifu/case/comment/list', { params });
}

/**
 * Get Peifu Post List
 */
export async function getCasePeifuPostListApi(params: {
  page?: number;
  size?: number;
  tid: number | string;
}) {
  return requestClient.get<{
    list: TbCasePeifuPost[];
    total: number;
  }>('/peifu/case/comment/post/list', { params });
}

/**
 * Add Peifu Post
 */
export async function addCasePeifuPostApi(group: TbCasePeifuPost) {
  return requestClient.post('/peifu/case/comment/post/add', group);
}

/**
 * Add Peifu Main Record
 */
export async function addCasePeifuApi(groupInfo: TbCasePeifu) {
  return requestClient.post('/peifu/case/comment/add', groupInfo);
}

/**
 * Update Peifu Main Record
 */
export async function updateCasePeifuApi(groupInfo: TbCasePeifu) {
  return requestClient.post('/peifu/case/comment/update', groupInfo);
}
