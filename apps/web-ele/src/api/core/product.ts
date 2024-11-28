import { requestClient } from '#/api/request';

export namespace ProductApi {
  /** 登录接口参数 */
  export interface PageParams {
    page: number;
    size: number;
    keywords?: string;
  }

  /** 登录接口返回值 */
  export interface ProductResult {
    list: any[];
  }
}

/**
 * 登录
 */
export async function productListApi(params: ProductApi.PageParams) {
  return requestClient.get<ProductApi.ProductResult>('/product/list', {
    params,
  });
}
