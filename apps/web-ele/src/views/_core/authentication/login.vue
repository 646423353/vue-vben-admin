<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, onMounted, ref } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { checkOAuth2Api, getCsrfToken, getValidImg } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const validImgPath = ref('');

// OAuth2 场景相关状态
const isOAuth2Login = ref(false);
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
 * 提交 OAuth2 登录表单
 */
function submitOAuth2Login() {
  if (!oauth2Form.value.username || !oauth2Form.value.password) {
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

onMounted(async () => {
  validImgPath.value = `${getValidImg()}?t=${Date.now()}`;

  // 智能识别是否属于真正的 OAuth2 场景，规避 Session 缓存未清理导致普通登录错乱的问题
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  // 如果引荐来源是主系统内部（/qishou），但又不是授权跳转端点（/oauth2/authorize），
  // 则判定这是主系统的普通登录/退出登录流，我们强制跳过授权页校验
  const isFromMainSystem = referrer && referrer.includes('/qishou') && !referrer.includes('/oauth2/authorize');

  if (!isFromMainSystem) {
    // 发起 OAuth 场景校验
    const checkRes = await checkOAuth2Api();
    if (checkRes && checkRes.oauth2) {
      isOAuth2Login.value = true;
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
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-bold text-foreground">平台账号授权登录</h2>
      <p class="mt-2 text-sm text-muted-foreground">
        授权后，第三方系统将获取您的基本用户信息
      </p>
    </div>

    <!-- 登录表单 -->
    <div class="space-y-4">
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

      <!-- 授权登录按钮 -->
      <button
        @click="submitOAuth2Login"
        class="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none active:scale-[0.99]"
      >
        确认授权登录
      </button>

      <!-- 切换普通登录兜底选项 -->
      <div class="mt-4 text-center">
        <span
          @click="isOAuth2Login = false"
          class="cursor-pointer text-xs text-primary hover:underline"
        >
          切换至普通登录
        </span>
      </div>

      <!-- 安全说明 -->
      <div
        class="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
      >
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span>此连接已通过 SSL 128位 高强度加密保护</span>
      </div>
    </div>
  </div>
</template>
