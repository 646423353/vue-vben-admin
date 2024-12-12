import { requestClient } from '#/api/request';

export namespace GroupApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: string;
    endTime?: string;
  }

  export interface GroupData {
    insureSn: string;
    groupName: string;
    mainInsureId: number | string;
    mainInsure?: string;
    additionalInsureId: number | string;
    additionalInsure?: string;
    status: number;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface PageData extends Partial<GroupData> {}

  export interface GroupDetail extends GroupData {
    id: number;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
  }

  /** 操作成功返回值 */
  export interface GroupResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function GroupListApi(
  data: GroupApi.PageData,
  params: GroupApi.PageParams,
) {
  return requestClient.post<GroupApi.ListResult>('/insure/group/list', data, {
    params,
  });
}

/**
 * 添加主险或副险方案接口
 */
export async function GroupAddApi(data: GroupApi.GroupData) {
  return requestClient.post<GroupApi.GroupResult>('/insure/group/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function GroupUpdateApi(data: GroupApi.GroupDetail) {
  return requestClient.post<GroupApi.GroupResult>('/insure/group/update', data);
}

/**
 * 获取主险或副险方案详情接口
 */
export async function GroupGetApi(id: number | string) {
  return requestClient.get<GroupApi.GroupDetail>('/insure/group/get', {
    params: { id },
  });
}

/**
 * 删除主险或副险方案接口
 */
export async function GroupDelApi(id: number | string) {
  return requestClient.post<GroupApi.GroupDetail>(
    '/insure/group/del',
    {},
    { params: { id } },
  );
}
