import { requestClient } from '#/api/request';

export namespace CaseSpecialJudgmentApi {
  export interface TbCaseSettingMoneyPanding {
    comments?: string;
    created?: string;
    id?: number;
    status?: number; // 1正常 0 删除
    title?: string;
    uid?: string;
    uidModify?: string;
  }

  /**
   * 获取特殊判定标签列表
   */
  export async function getSpecialJudgmentTagList() {
    return requestClient.get<TbCaseSettingMoneyPanding[]>(
      '/record/set/panding/cate',
    );
  }

  /**
   * 添加特殊判定标签
   */
  export async function addSpecialJudgmentTag(data: TbCaseSettingMoneyPanding) {
    return requestClient.post<any>('/record/set/panding/add', data);
  }

  /**
   * 删除(停用)特殊判定标签
   */
  export async function delSpecialJudgmentTag(data: { id: number }) {
    return requestClient.post<any>('/record/set/panding/del', null, {
      params: data,
    });
  }

  /**
   * 修改特殊判定标签
   */
  export async function updateSpecialJudgmentTag(
    data: TbCaseSettingMoneyPanding,
  ) {
    return requestClient.post<any>('/record/set/panding/update', data);
  }
}
