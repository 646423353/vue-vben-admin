import { baseRequestClient, requestClient } from '#/api/request';

export namespace TaskApi {
  /** 操作成功返回值 */
  export interface TaskResult {
    result: string;
  }

  export interface PageParams {
    page: number;
    size: number;
  }

  export interface PostPageParams extends PageParams {
    orderId?: string;
    jobId?: string;
  }
}

/**
 * 启动任务
 */
export async function TaskAddApi() {
  return baseRequestClient.post<TaskApi.TaskResult>('/task/add', {});
}

/**
 * 获取查看是否需要验证码
 */
export async function TaskCodeScanApi() {
  return requestClient.get<TaskApi.TaskResult>('/task/code/scan');
}

/**
 * 提交验证码
 */
export async function TaskCodeSendApi(code: string) {
  return requestClient.post<TaskApi.TaskResult>(
    '/task/code/send',
    {},
    {
      params: { code },
    },
  );
}

/**
 * 获取任务状态
 */
export async function TaskGetApi() {
  return requestClient.get<TaskApi.TaskResult>('/task/get');
}

/**
 * 获取任务列表
 */
export async function TaskListApi(params: TaskApi.PageParams) {
  return requestClient.get<TaskApi.TaskResult>('/task/list', { params });
}

/**
 * 获取投保记录
 */
export async function TaskPostListApi(params: TaskApi.PostPageParams) {
  return requestClient.get<TaskApi.TaskResult>('/task/post/list', { params });
}
