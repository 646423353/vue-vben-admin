<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { checkOAuth2Api, getCsrfToken, getValidImg } from '#/api';
import { useAccessStore, useUserStore } from '@vben/stores';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const accessStore = useAccessStore();
const userStore = useUserStore();
const route = useRoute();

const validImgPath = ref('');

// OAuth2 场景相关状态
const isOAuth2Login = ref(false);
const isAlreadyLoggedIn = ref(false);
const csrfToken = ref('');
const oauth2Form = ref({ username: '', password: '' });

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
        class: 'h-12 bg-[#f1f4f8] text-base dark:bg-background border-0',
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
        class: 'h-12 bg-[#f1f4f8] text-base dark:bg-background border-0',
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      componentProps: {
        class: 'h-12',
      },
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});

/**
 * [未登录时] 提交 OAuth2 账密表单
 */
function submitOAuth2Login() {
  if (!oauth2Form.value.username || !oauth2Form.value.password) {
    return;
  }

  const form = document.createElement('form');
  form.method = 'POST';
  
  let loginAction = '/login';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      loginAction = 'http://124.222.12.38/login';
    }
  }
  form.action = loginAction;

  const fields: Record<string, string> = {
    _csrf: csrfToken.value,
    username: oauth2Form.value.username,
    password: oauth2Form.value.password,
  };

  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.append(input);
  }

  document.body.append(form);
  form.submit();
}

/**
 * [已登录时] 点击同意并授权：直连重定向免密链路
 */
function handleApprove() {
  const origin = window.location.origin;
  const authorizeUrl = `${origin}/oauth2/authorize?response_type=code&client_id=workorder&redirect_uri=${encodeURIComponent(
    `${origin}/workorder/oauth/callback`,
  )}&scope=profile&custom_session_token=${accessStore.accessToken}`;
  
  window.location.href = authorizeUrl;
}

/**
 * [已登录时] 点击切换账号：退出当前身份，切换回输入账密状态
 */
function handleSwitchAccount() {
  accessStore.setAccessToken('');
  isAlreadyLoggedIn.value = false;
  csrfToken.value = getCsrfToken(); // 恢复账密界面前必须重新获取 csrf token
}

onMounted(async () => {
  validImgPath.value = `${getValidImg()}?t=${Date.now()}`;

  // 必须明确在路由或 URL 中带有 oauth2=1 参数时，才视为进入了 OAuth2 登录流程
  // 避免由于后端 Session 中残留的 SavedRequest 导致普通访问也被误判为 OAuth2
  if (route.query.oauth2 === '1' || window.location.href.includes('oauth2=1')) {
    // 发起 OAuth 场景校验
    const checkRes = await checkOAuth2Api();
    if (checkRes && checkRes.oauth2) {
      localStorage.removeItem('sso_oauth2_pending'); // 清理放行标志
      isOAuth2Login.value = true;

      // 关键：如果主系统已登录，显示华丽的应用授权申请页面
      if (accessStore.accessToken) {
        isAlreadyLoggedIn.value = true;
        if (typeof document !== 'undefined') {
          document.cookie = `custom.session=${accessStore.accessToken}; path=/`;
        }
        return;
      }

      // 未登录时，获取 csrfToken 并显示账密表单
      csrfToken.value = getCsrfToken();
    }
  }
});
</script>

<template>
  <AuthenticationLogin
    v-if="!isOAuth2Login"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  />

  <div v-else class="flex w-full flex-col justify-center">

    <!-- ===== [情形A：已登录] 完美复刻：应用授权申请 ===== -->
    <div v-if="isAlreadyLoggedIn" class="space-y-6">
      <!-- 绿盾图标和标题区 -->
      <div class="flex flex-col items-center text-center">
        <div class="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <svg class="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div class="absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-500 text-white">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 class="text-[22px] font-bold text-foreground tracking-wide">应用授权申请</h2>
        <p class="mt-2.5 text-xs text-muted-foreground">
          第三方系统申请获取您骑手理赔平台的授权
        </p>
      </div>

      <!-- 当前登录账号卡片 -->
      <div class="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#0284c7] text-xl font-bold text-white shadow-inner">
          {{ (userStore.userInfo?.username || userStore.userInfo?.realName || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-slate-400">当前登录账号</span>
          <span class="text-base font-bold tracking-wide text-foreground">{{ userStore.userInfo?.username || userStore.userInfo?.realName || '已登录用户' }}</span>
        </div>
      </div>

      <!-- 授权权限清单 -->
      <div class="rounded-xl bg-[#f8fafc] p-4 dark:bg-slate-900/50">
        <div class="mb-2 text-xs font-bold text-foreground">授权后将允许第三方系统：</div>
        <ul class="space-y-2 text-xs text-slate-500">
          <li class="flex items-start gap-2">
            <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
            获取您的基本个人信息（姓名、账号ID等）
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400"></span>
            用于进行系统单点登录和身份校验
          </li>
        </ul>
      </div>

      <!-- 操作按钮组 -->
      <div class="space-y-3 pt-2">
        <button
          @click="handleApprove"
          class="flex h-12 w-full items-center justify-center rounded-lg bg-[#10b981] text-[15px] font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
        >
          同意并授权登录
        </button>
        <button
          @click="handleSwitchAccount"
          class="flex h-12 w-full items-center justify-center rounded-lg border border-border bg-transparent text-[15px] font-bold text-foreground transition-all hover:bg-slate-50 active:scale-[0.98] dark:hover:bg-slate-800"
        >
          切换账号
        </button>
      </div>

      <!-- 底部安全提示 -->
      <div class="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-80" />
        <span>此连接已通过 SSL 128位 高强度加密保护</span>
      </div>
    </div>


    <!-- ===== [情形B：未登录] 账密授权表单 ===== -->
    <div v-else class="space-y-4">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold text-foreground">平台账号授权登录</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          授权后，第三方系统将获取您的基本用户信息
        </p>
      </div>

      <div class="relative">
        <label class="mb-1.5 block text-sm font-medium text-foreground">用户名 / 邮箱</label>
        <input
          type="text"
          v-model="oauth2Form.username"
          placeholder="请输入平台用户名"
          class="h-12 w-full rounded-lg border border-transparent bg-[#f1f4f8] px-4 text-base transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-background"
          required
        />
      </div>

      <div class="relative mt-4">
        <label class="mb-1.5 block text-sm font-medium text-foreground">密码</label>
        <input
          type="password"
          v-model="oauth2Form.password"
          placeholder="请输入密码"
          class="h-12 w-full rounded-lg border border-transparent bg-[#f1f4f8] px-4 text-base transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-background"
          required
          @keydown.enter="submitOAuth2Login"
        />
      </div>

      <button
        @click="submitOAuth2Login"
        class="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none active:scale-[0.99]"
      >
        确认授权登录
      </button>
      <!-- 安全说明 -->
      <div class="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span>此连接已通过 SSL 128位 高强度加密保护</span>
      </div>
    </div>
  </div>
</template>
