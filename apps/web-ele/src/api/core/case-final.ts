import { requestClient } from '#/api/request';

/**
 * 最终赔付记录
 */
export interface TbCaseFinal {
  id?: number | string;
  caseId?: number | string;
  uuid?: string; // 最终赔付表uuid
  zt?: string; // 主体id
  ztName?: string; // 主体名称
  ztUsername?: string; // 姓名
  ztPhone?: string; // 主体手机号
  moneyMain?: number; // 主险赔付金额
  card?: string; // 银行卡号
  bank?: string; // 银行
  beginTime?: string; // 付款开始时间
  endTime?: string; // 赔付到账时间
  lisuanshu?: string; // 理算书
  attatchs?: string; // 附件（JSON字符串）
  created?: string;
  updated?: string;
}

/**
 * Get Final Payment List
 */
export async function getCaseFinalListApi(params: {
  caseId: number | string;
  maxId?: string;
  page?: number;
  size?: number;
}) {
  return requestClient.get<{
    list: TbCaseFinal[];
    total: number;
  }>('/final/case/comment/list', { params });
}

/**
 * Add Final Payment Record
 */
export async function addCaseFinalApi(data: TbCaseFinal) {
  return requestClient.post('/final/case/comment/add', data);
}

/**
 * Update Final Payment Record
 */
export async function updateCaseFinalApi(data: TbCaseFinal) {
  return requestClient.post('/final/case/comment/update', data);
}
