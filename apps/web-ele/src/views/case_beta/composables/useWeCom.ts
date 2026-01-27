import { ref } from 'vue';

import {
  getLocalImgData,
  getRealSignature,
  initSdk as initWxSdk,
  selectImage,
} from './wx-sdk';

export function useWeCom() {
  const isWeComAvailable = ref(false);

  const isWeComAgent = () => {
    return /wxwork/i.test(navigator.userAgent);
  };

  // Use UA check for availability as requested previously
  const isWeCom = isWeComAgent;

  const initSdk = async () => {
    if (!isWeComAgent()) return;

    try {
      const corpId = import.meta.env.VITE_WECOM_CORP_ID || 'ww696c79f785901369';
      const agentId = import.meta.env.VITE_WECOM_AGENT_ID || '1000002';

      await initWxSdk({
        corpId,
        agentId,
        jsApiList: [
          'checkJsApi',
          'chooseImage',
          'getLocalImgData',
          'previewImage',
          'agentConfig',
          'selectImage', // Include selectImage for compatibility
        ],
        // Use real signature fetching logic as requested
        getConfigSignature: (url) => getRealSignature(url, 'corp'),
        getAgentConfigSignature: (url) => getRealSignature(url, 'app'),
      });

      // console.log('SDK init success via wx-sdk');
      isWeComAvailable.value = true;
    } catch (error) {
      console.error('SDK init failed:', error);
      isWeComAvailable.value = false;
    }
  };

  const invokeSelectImage = async () => {
    try {
      const res = await selectImage();
      // Adapt result to expected format { localIds: [...] }
      if (res.localIds) {
        return { localIds: res.localIds };
      } else if (res.mediaIds) {
        // If mediaIds returned (fallback), strictly we need localIds for display if we want to preview.
        // But for upload, mediaIds might be what we need?
        // DraggableUploadList expects localIds for display?
        // It says: "Placeholder: We can't display localIds directly..."
        // So returning what we have is fine.
        return { localIds: res.mediaIds };
      }
      return res;
    } catch (error) {
      console.error('selectImage failed', error);
      throw error;
    }
  };

  return {
    isWeCom,
    isWeComAvailable, // Keep for compatibility if needed, though isWeCom (UA) is preferred
    initSdk,
    chooseImage: invokeSelectImage,
    getLocalImgData,
  };
}
