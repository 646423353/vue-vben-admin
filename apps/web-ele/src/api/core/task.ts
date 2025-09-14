import { requestClient } from '#/api/request';

export namespace TaskApi {
  /** 操作成功返回值 */
  export interface TaskResult {
    result: number | string;
  }

  export interface PageParams {
    page: number;
    size: number;
  }

  export interface PostPageParams extends PageParams {
    orderId?: string;
    jobId?: number | string;
  }

  export interface LogPageParams extends PageParams {
    jobId?: string;
  }

  export interface OrderPageParams extends PageParams {
    phone: string;
  }

  export interface ListResult {
    list: any[];
    total: number;
  }

  export interface TaskStatusResult {
    excelStatus: number;
    message: string;
    orderCount: number;
    policyCount: number;
    policyCountSuccess: number;
    remark: string;
    status: number;
    toubaoStatus: number;
    uid: string;
    uuid: string;
    workStatus: number;
    created: string;
    endTime: string;
    id: number;
    phone: string;
    startTime: string;
  }
}

/**
 * 启动任务
 */
export async function TaskAddApi(phone: string) {
  return requestClient.post<TaskApi.TaskResult>(
    '/task/add',
    {},
    { params: { phone } },
  );
}

/**
 * 获取查看是否需要验证码
 */
export async function TaskCodeScanApi(phone: string) {
  return requestClient.get<number>('/task/code/scan', { params: { phone } });
}

/**
 * 提交验证码
 */
export async function TaskCodeSendApi(code: string, phone: string) {
  return requestClient.post<TaskApi.TaskResult>(
    '/task/code/send',
    {},
    {
      params: { code, phone },
    },
  );
}

/**
 * 获取任务状态
 */
export async function TaskGetApi() {
  return requestClient.get<TaskApi.TaskStatusResult>('/task/get');
}

/**
 * 获取任务列表
 */
export async function TaskListApi(params: TaskApi.PageParams) {
  return requestClient.get<TaskApi.ListResult>('/task/list', { params });
}

/**
 * 获取日志列表
 */
export async function TaskLogApi(params: TaskApi.LogPageParams) {
  return requestClient.get<TaskApi.ListResult>('/task/log', { params });
}

/**
 * 获取投保记录
 */
export async function TaskPostListApi(params: TaskApi.PostPageParams) {
  return requestClient.get<TaskApi.ListResult>('/task/post/list', { params });
}

/**
 * 获取当日待投保列表
 */
export async function TaskOrdersApi(params: TaskApi.OrderPageParams) {
  return requestClient.get<TaskApi.ListResult>('/task/orders', { params });
}

/**
 * 获取任务运行状态
 */
export async function TaskChromeStatusApi(params: TaskApi.PageParams) {
  return requestClient.get<TaskApi.ListResult>('/task/chrome/status', {
    params,
  });
}
