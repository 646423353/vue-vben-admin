import * as ww from '@wecom/jssdk';

// 签名相关参数接口
export interface WxRegisterParams {
  corpId: string;
  agentId: string;
  jsApiList: string[];
  getConfigSignature: (
    url: string,
  ) => Promise<{ nonceStr: string; signature: string; timestamp: number }>;
  getAgentConfigSignature: (
    url: string,
  ) => Promise<{ nonceStr: string; signature: string; timestamp: number }>;
}

/**
 * 初始化企业微信 SDK
 * 使用 ww.register 替代了旧版的 wx.config 和 wx.agentConfig
 */
export const initSdk = async (params: WxRegisterParams) => {
  try {
    await ww.register({
      corpId: params.corpId,
      agentId: params.agentId,
      jsApiList: params.jsApiList,
      getConfigSignature: params.getConfigSignature,
      getAgentConfigSignature: params.getAgentConfigSignature,
    });
    // console.debug('ww.register success');
  } catch (error) {
    console.error('ww.register failed', error);
    throw error;
  }
};

export interface SelectImageResult {
  localIds?: string[]; // 官方文档返回 localIds
  mediaIds?: string[]; // 旧版兼容
  [key: string]: any;
}

/**
 * 选择图片
 */
export const selectImage = async (): Promise<SelectImageResult> => {
  // 根据官方文档使用 ww.chooseImage
  // @ts-ignore: SDK type definition missing
  if (ww.chooseImage) {
    // @ts-ignore: SDK type definition missing
    const res = (await ww.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'] as any,
      sourceType: ['album', 'camera'] as any,
    })) as any;

    return {
      localIds: res.localIds,
      // 如果有其他字段需要透传
      ...res,
    };
  } else {
    // Fallback if ww.chooseImage is missing (unlikely in new SDK)
    console.warn('ww.chooseImage not found, trying invoke');
    // @ts-ignore: SDK type definition missing
    if (ww.invoke) {
      // @ts-ignore: SDK type definition missing
      const res = (await ww.invoke('selectImage', { count: 9 })) as any;
      return { mediaIds: res.mediaIds || res.fileIds };
    }
    throw new Error('Choose image API not found in ww object');
  }
};

/**
 * 获取本地图片数据 (Base64)
 */
export const getLocalImgData = (localId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore: Global type definition missing
    const wx = window.wx || (window as any).jWeixin;
    if (wx && wx.getLocalImgData) {
      wx.getLocalImgData({
        localId,
        success: (res: any) => {
          resolve(res.localData);
        },
        fail: (err: any) => {
          console.error('wx.getLocalImgData failed', err);
          reject(err);
        },
      });
    } else {
      // Try ww.invoke fallback
      // @ts-ignore: SDK type definition missing
      if (ww.invoke) {
        // @ts-ignore: SDK type definition missing
        ww.invoke('getLocalImgData', { localId }, (res: any) => {
          if (res.errMsg === 'getLocalImgData:ok') {
            resolve(res.localData);
          } else {
            reject(res);
          }
        });
      } else {
        reject(new Error('getLocalImgData API not found'));
      }
    }
  });
};

// 获取真实签名
export const getRealSignature = async (url: string, type: 'app' | 'corp') => {
  // 定义接口地址 (服务端已计算签名的聚合接口)
  // 默认尝试使用 query 参数传递 url
  const apiUrl = `/wxapi/qywx-utils/signatures?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();

    // 预期结构:
    // {
    //   "meta": { "nonceStr": "...", "timestamp": ... },
    //   "app": { "ticket": "...", "signature": "..." },
    //   "corp": { "ticket": "...", "signature": "..." }
    // }

    if (!data.meta || !data[type]) {
      throw new Error(
        `Signature response invalid or missing key for type: ${type}`,
      );
    }

    const { timestamp, nonceStr } = data.meta;
    const { signature } = data[type];

    // console.debug(`[Signature] Type: ${type}, URL: ${url}, Sig: ${signature}`);

    return {
      timestamp: Number(timestamp),
      nonceStr,
      signature,
    };
  } catch (error) {
    console.error('Get real signature failed', error);
    throw error;
  }
};

// 保留 mock 用于降级或其他测试（可选）
export const mockGetSignature = (_url: string) => {
  console.warn('Mock signature is deprecated.');
  return Promise.resolve({ timestamp: 0, nonceStr: '', signature: '' });
};
