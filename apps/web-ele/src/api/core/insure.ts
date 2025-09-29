import { requestClient } from '#/api/request';

export namespace InsureApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    beginTime?: number | string;
    endTime?: number | string;
  }

  export interface LogPageParams extends PageParams {
    cid: number | string;
  }

  export interface PageData {
    cate: number;
  }

  export interface InsureData {
    cate: number;
    ordertype: string;
    money: string;
    days: string;
    ticketCompany: string;
    emails: string;
    sendPeriod: string;
    sendType: string;
    fileUrl: string;
    status: number;
  }

  export interface InsureDetail extends InsureData {
    id: number;
  }

  /** 列表接口返回值 */
  export interface ListResult {
    list: any[];
    total: number;
  }

  /** 操作成功返回值 */
  export interface InsureResult {
    result: string;
  }
}

/**
 * 获取主险或副险方案列表接口
 */
export async function InsureListApi(
  data: InsureApi.PageData,
  params: InsureApi.PageParams,
) {
  return requestClient.post<InsureApi.ListResult>('/insure/list', data, {
    params,
  });
}

/**
 * 添加主险或副险方案接口
 */
export async function InsureAddApi(data: InsureApi.InsureData) {
  return requestClient.post<InsureApi.InsureResult>('/insure/add', data);
}

/**
 * 更新主险或副险方案接口
 */
export async function InsureUpdateApi(data: InsureApi.InsureDetail) {
  return requestClient.post<InsureApi.InsureResult>('/insure/update', data);
}

/**
 * 获取主险或副险方案详情接口
 */
export async function InsureGetApi(id: number | string) {
  return requestClient.get<InsureApi.InsureDetail>('/insure/get', {
    params: { id },
  });
}

/**
 * 删除主险或副险方案接口
 */
export async function InsureDelApi(id: number | string) {
  return requestClient.post<InsureApi.InsureDetail>(
    '/insure/del',
    {},
    { params: { id } },
  );
}

/**
 * 获取主险或副险方案操作日志列表接口
 */
export async function InsureLogListApi(params: InsureApi.LogPageParams) {
  return requestClient.post<InsureApi.ListResult>(
    '/insure/log/list',
    {},
    {
      params,
    },
  );
}
