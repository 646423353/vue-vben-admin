<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, h, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getValidImg } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const validImgPath = ref('');

const formSchema = computed((): VbenFormSchema[] => {
  return [
    // {
    //   component: '',
    //   fieldName: 'username',
    //   defaultValue: 'admin',
    // },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '验证码',
      },
      fieldName: 'validate',
      label: '验证码',
      suffix: () =>
        h(
          'span',
          {
            class: 'cursor-pointer',
          },
          [
            h('img', {
              onClick: () =>
                (validImgPath.value = `${getValidImg()}?t=${Date.now()}`),
              width: '125px',
              src: validImgPath.value,
            }),
          ],
        ),
      rules: z.string().min(4, { message: '请输入验证码' }),
    },
    // {
    //   component: markRaw(SliderCaptcha),
    //   fieldName: 'captcha',
    //   rules: z.boolean().refine((value) => value, {
    //     message: $t('authentication.verifyRequiredTip'),
    //   }),
    // },
  ];
});

onMounted(() => {
  validImgPath.value = `${getValidImg()}?t=${Date.now()}`;
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  />
</template>
