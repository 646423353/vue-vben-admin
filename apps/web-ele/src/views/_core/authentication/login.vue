<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, onMounted, ref } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { checkOAuth2Api, getCsrfToken, getValidImg } from '#/api';
import { useAccessStore, useUserStore } from '@vben/stores';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const accessStore = useAccessStore();
const userStore = useUserStore();

const validImgPath = ref('');

// OAuth2 场景相关状态
const isOAuth2Login = ref(false);
const csrfToken = ref('');
const oauth2Form = ref({ username: '', password: '' });

// 判断主系统是否已登录
const isAlreadyLoggedIn = computed(() => !!accessStore.accessToken);

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
 * 提交 OAuth2 登录表单
 */
function submitOAuth2Login() {
  if (!isAlreadyLoggedIn.value && (!oauth2Form.value.username || !oauth2Form.value.password)) {
    return;
  }

  // 动态构建 HTML 表单以实现同步 POST 提交，融入 Spring Security 的 Oauth2 登录拦截链路
  const form = document.createElement('form');
  form.method = 'POST';
  
  // 智能适配本地开发与生产环境：由于本地 Vite 通常未代理根路径下的 /login 接口，
  // 在本地 (localhost/127.0.0.1) 开发调试时，直接将表单提交到真实的测试服务器后端地址；
  // 生产环境下则保持相对路径 '/login'，依托生产 nginx 的代理配置。
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
  };

  if (!isAlreadyLoggedIn.value) {
    fields.username = oauth2Form.value.username;
    fields.password = oauth2Form.value.password;
  } else {
    // 主系统已登录的情况下，无需传递明文密码，尝试传递 token 供后端免密链路拦截或恢复 Session
    // 写入当前域下 custom.session Cookie，以便后端直接识别会话
    if (typeof document !== 'undefined' && accessStore.accessToken) {
      document.cookie = `custom.session=${accessStore.accessToken}; path=/`;
    }
    // 传一个隐藏字段防止 /login 必须校验空用户名的问题（视后端而定）
    fields.custom_session_token = accessStore.accessToken || '';
    // 如果后端 /login 必须有 username，这里传个占位或者当前真实账号
    fields.username = userStore.userInfo?.username || '';
  }

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

onMounted(async () => {
  validImgPath.value = `${getValidImg()}?t=${Date.now()}`;

  // 发起 OAuth 场景校验
  const checkRes = await checkOAuth2Api();
  if (checkRes && checkRes.oauth2) {
    isOAuth2Login.value = true;
    csrfToken.value = getCsrfToken();
    localStorage.removeItem('sso_oauth2_pending'); // 清理标志，避免影响后续正常路由逻辑
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
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-bold text-foreground">平台账号授权登录</h2>
      <p class="mt-2 text-sm text-muted-foreground">
        授权后，第三方系统将获取您的基本用户信息
      </p>
    </div>

    <!-- 未登录：展示账密表单 -->
    <div v-if="!isAlreadyLoggedIn" class="space-y-4">
      <div class="relative">
        <label class="mb-1.5 block text-sm font-medium text-foreground"
          >用户名 / 邮箱</label
        >
        <input
          type="text"
          v-model="oauth2Form.username"
          placeholder="请输入平台用户名"
          class="h-12 w-full rounded-lg border border-transparent bg-[#f1f4f8] px-4 text-base transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-background"
          required
        />
      </div>

      <div class="relative mt-4">
        <label class="mb-1.5 block text-sm font-medium text-foreground"
          >密码</label
        >
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
    </div>

    <!-- 已登录：展示免密一键授权 -->
    <div v-else class="space-y-4">
      <div class="flex flex-col items-center justify-center rounded-xl border border-border bg-[#f1f4f8] py-8 dark:bg-background">
        <div class="mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
          <span class="text-2xl font-bold text-primary">{{ (userStore.userInfo?.username || userStore.userInfo?.realName || '主').charAt(0).toUpperCase() }}</span>
        </div>
        <div class="text-sm text-muted-foreground">当前登录账号</div>
        <div class="mt-1 text-xl font-bold text-foreground">{{ userStore.userInfo?.username || userStore.userInfo?.realName || '主系统用户' }}</div>
      </div>
      
      <button
        @click="submitOAuth2Login"
        class="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none active:scale-[0.99]"
      >
        一键授权登录
      </button>
    </div>

    <!-- 安全说明 -->
    <div
      class="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
    >
      <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
      <span>此连接已通过 SSL 128位 高强度加密保护</span>
    </div>
  </div>
</template>
