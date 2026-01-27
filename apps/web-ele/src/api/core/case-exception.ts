import { requestClient } from '#/api/request';

export namespace CaseExceptionApi {
  export interface ExceptionsSettingFileCate {
    comments?: string;
    created?: string;
    id?: number;
    status?: number; // 1正常 0 删除
    title?: string;
    uid?: string;
    uidModify?: string;
  }

  /**
   * 获取异常原因列表
   */
  export async function getExceptionReasonList() {
    return requestClient.get<ExceptionsSettingFileCate[]>(
      '/record/set/except/cate',
    );
  }

  /**
   * 添加异常原因
   */
  export async function addExceptionReason(data: ExceptionsSettingFileCate) {
    return requestClient.post<any>('/record/set/except/add', data);
  }

  /**
   * 删除(停用)异常原因
   */
  export async function delExceptionReason(data: { id: number }) {
    return requestClient.post<any>('/record/set/except/del', null, {
      params: data,
    });
  }

  /**
   * 修改异常原因
   */
  export async function updateExceptionReason(data: ExceptionsSettingFileCate) {
    return requestClient.post<any>('/record/set/except/update', data);
  }
}
