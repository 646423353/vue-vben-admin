<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useTabs } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

defineOptions({ name: 'WorkOrderSSO' });

const router = useRouter();
const { closeCurrentTab } = useTabs();
const accessStore = useAccessStore();
const statusText = ref('正在安全接入工单系统...');
const isError = ref(false);

onMounted(async () => {
  // 1. 检查主系统本地是否处于登录状态
  if (!accessStore.accessToken) {
    statusText.value = '您尚未登录，正在为您跳转到登录页面...';
    setTimeout(() => {
      router.push('/auth/login');
    }, 1500);
    return;
  }

  try {
    statusText.value = '正在为您跳转到工单系统...';

    // 诊断：检查 cookie（可选，帮助排查）
    if (
      typeof document !== 'undefined' && // 关键修复：前端手动将 Token 种入 Cookie 中，对齐后端 Shiro Redis Session 的校验逻辑
      accessStore.accessToken
    ) {
      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `custom.session=${accessStore.accessToken}; path=/`;
      console.warn('SSO修复 - 已成功种入 custom.session Cookie');
    }

    // 2. 动态拼装工单系统 OAuth2 授权链接
    const origin = window.location.origin;
    // 双保险：不仅写 Cookie，还在 URL 后面带上 token 参数，方便后端读取
    const authorizeUrl = `${origin}/oauth2/authorize?response_type=code&client_id=workorder&redirect_uri=${encodeURIComponent(
      `${origin}/workorder/oauth/callback`,
    )}&scope=profile&custom_session_token=${accessStore.accessToken}`;

    // 3. 保存授权链接到 sessionStorage，以备降级使用
    sessionStorage.setItem('oauth2_authorize_url', authorizeUrl);

    // 4. 在新标签页中打开工单系统，当前标签页关闭
    window.open(authorizeUrl, '_blank');
    closeCurrentTab();
  } catch (error) {
    console.error('SSO redirect failed:', error);
    isError.value = true;
    statusText.value = '工单系统跳转失败，请尝试刷新页面或联系管理员。';
  }
});
</script>

<template>
  <div
    class="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white"
  >
    <!-- 精美的微动效加载图标 -->
    <div class="relative mb-8 flex h-24 w-24 items-center justify-center">
      <!-- 外层炫彩旋转光圈 -->
      <div
        class="absolute h-full w-full animate-spin rounded-full border-4 border-emerald-500/10 border-t-emerald-500"
      ></div>
      <!-- 内层反向旋转光圈 -->
      <div
        class="absolute h-16 w-16 animate-spin rounded-full border-4 border-primary/10 border-b-primary"
        style="animation-duration: 1.5s; animation-direction: reverse"
      ></div>
      <!-- 居中的安全锁盾微图标 -->
      <div class="z-10 text-emerald-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
    </div>

    <!-- 动态文案提示 -->
    <div class="space-y-3 text-center">
      <h3
        class="text-xl font-bold tracking-wide transition-all duration-300"
        :class="{ 'text-rose-400': isError, 'text-emerald-400': !isError }"
      >
        {{ isError ? '安全接入受阻' : '安全单点登录' }}
      </h3>
      <p class="text-sm text-slate-300">{{ statusText }}</p>
    </div>

    <!-- 底部炫酷的安全字样 -->
    <div
      class="absolute bottom-8 flex items-center gap-1.5 text-xs text-slate-500"
    >
      <span class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500"></span>
      <span>Secured by Claims Unified SSO Portal</span>
    </div>
  </div>
</template>

<style scoped>
/* 可在这里编写过渡所需的精细样式，Tailwind 实用类已足够提供出色的视觉效果 */
</style>
