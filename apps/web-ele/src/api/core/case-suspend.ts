import { requestClient } from '#/api/request';

export namespace CaseSuspendApi {
  export interface SuspendSettingGuaqiType {
    comments?: string;
    created?: string;
    id?: number;
    status?: number; // 1正常 0 删除
    title?: string;
    uid?: string;
    uidModify?: string;
  }

  /**
   * 获取挂起原因列表
   */
  export async function getSuspendReasonList() {
    return requestClient.get<SuspendSettingGuaqiType[]>(
      '/record/set/guaqi/cate',
    );
  }

  /**
   * 添加挂起原因
   */
  export async function addSuspendReason(data: SuspendSettingGuaqiType) {
    return requestClient.post<any>('/record/set/guaqi/add', data);
  }

  /**
   * 删除(停用)挂起原因
   */
  export async function delSuspendReason(data: { id: number }) {
    return requestClient.post<any>('/record/set/guaqi/del', null, {
      params: data,
    });
  }

  /**
   * 修改挂起原因
   */
  export async function updateSuspendReason(data: SuspendSettingGuaqiType) {
    return requestClient.post<any>('/record/set/guaqi/update', data);
  }
}
