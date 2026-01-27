import { requestClient } from '#/api/request';

export namespace CaseTimeoutApi {
  export interface TbCaseSettingTimeout {
    comments?: string; // 备注
    created?: string; // 创建日期
    hours?: number; // 小时数
    id?: number; // 标签id
    status?: number; // 1正常 0 删除 2失效
    title?: string; // 标签名称
    type?: number; // 类型：0案件超时 1案件严重超时 2对接超时 3对接严重超时
    uid?: string; // 创建人编号
    uidModify?: string; // 最后修改人编号
  }

  export interface TimeoutListParams {
    status: number;
  }
}

/**
 * Get timeout config list
 */
export async function getTimeoutListApi(
  params: CaseTimeoutApi.TimeoutListParams,
) {
  return requestClient.get<CaseTimeoutApi.TbCaseSettingTimeout[]>(
    '/record/set/timeout/cate',
    { params },
  );
}

/**
 * Update timeout config
 */
export async function updateTimeoutApi(
  data: CaseTimeoutApi.TbCaseSettingTimeout,
) {
  return requestClient.post('/record/set/timeout/update', data);
}
