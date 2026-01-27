import { requestClient } from '#/api/request';

export namespace CaseSetApi {
  export interface TbCasesSettingFileCate {
    comments?: string;
    created?: string;
    id?: number;
    status?: number; // 1正常 0 删除
    title?: string;
    uid?: string;
    uidModify?: string;
  }

  /**
   * 获取文件标签列表
   */
  export async function getFileCateList() {
    return requestClient.get<TbCasesSettingFileCate[]>('/record/set/file/cate');
  }

  /**
   * 添加文件标签
   */
  export async function addFileCate(data: TbCasesSettingFileCate) {
    return requestClient.post<any>('/record/set/file/cate/add', data);
  }

  /**
   * 删除文件标签
   */
  export async function delFileCate(params: { id: number }) {
    return requestClient.post<any>('/record/set/file/cate/del', null, {
      params,
    });
  }

  /**
   * 修改文件标签
   */
  export async function updateFileCate(data: TbCasesSettingFileCate) {
    return requestClient.post<any>('/record/set/file/cate/update', data);
  }
  export interface TbCaseSettingMoneyCate {
    comments?: string;
    created?: string;
    id?: number;
    title?: string;
    uid?: string;
    uidModify?: string;
    status?: number;
  }

  export interface TbCaseSettingMoneyType {
    cateId?: number;
    comments?: string;
    created?: string;
    id?: number;
    title?: string;
    uid?: string;
    uidModify?: string;
    moban?: string;
    status?: number;
  }

  /**
   * 获取定损大类列表
   */
  export async function getMoneyCateList() {
    return requestClient.get<TbCaseSettingMoneyCate[]>(
      '/record/set/money/cate',
    );
  }

  /**
   * 添加定损大类
   */
  export async function addMoneyCate(data: TbCaseSettingMoneyCate) {
    return requestClient.post<any>('/record/set/money/cate/add', data);
  }

  /**
   * 删除定损大类
   */
  export async function delMoneyCate(params: { id: number }) {
    return requestClient.post<any>('/record/set/money/cate/del', null, {
      params,
    });
  }

  /**
   * 修改定损大类
   */
  export async function updateMoneyCate(data: TbCaseSettingMoneyCate) {
    return requestClient.post<any>('/record/set/money/cate/update', data);
  }

  /**
   * 获取定损项目列表
   */
  export async function getMoneyItems(params: { cateId: number }) {
    return requestClient.get<TbCaseSettingMoneyType[]>(
      '/record/set/money/items',
      { params },
    );
  }

  /**
   * 添加定损项目
   */
  export async function addMoneyItem(data: TbCaseSettingMoneyType) {
    return requestClient.post<any>('/record/set/money/item/add', data);
  }

  /**
   * 删除定损项目
   */
  export async function delMoneyItem(params: { id: number }) {
    return requestClient.post<any>('/record/set/money/item/del', null, {
      params,
    });
  }

  /**
   * 修改定损项目
   */
  export async function updateMoneyItem(data: TbCaseSettingMoneyType) {
    return requestClient.post<any>('/record/set/money/item/update', data);
  }
}
