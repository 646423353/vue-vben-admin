<script setup lang="ts">
import type { ToolbarType } from './types';

<<<<<<< HEAD
import { ref, watch } from 'vue';
=======
import { computed } from 'vue';
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f

import { preferences, usePreferences } from '@vben/preferences';

import { useDebounceFn, useWindowSize } from '@vueuse/core';

import { Copyright } from '../basic/copyright';
import AuthenticationFormView from './form.vue';
import SloganIcon from './icons/slogan.vue';
import Toolbar from './toolbar.vue';

interface Props {
  appName?: string;
  logo?: string;
  logoDark?: string;
  pageTitle?: string;
  pageDescription?: string;
  sloganImage?: string;
  toolbar?: boolean;
  copyright?: boolean;
  toolbarList?: ToolbarType[];
  clickLogo?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  appName: '',
  copyright: true,
  logo: '',
  logoDark: '',
  pageDescription: '',
  pageTitle: '',
  sloganImage: '',
  toolbar: true,
  toolbarList: () => ['color', 'language', 'layout', 'theme'],
  clickLogo: () => {},
});

const { authPanelCenter, authPanelLeft, authPanelRight, isDark } =
  usePreferences();

<<<<<<< HEAD
const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

const isHideLogo = ref(false);
function resize() {
  isHideLogo.value = height.value < 910;
}
resize();
=======
/**
 * @zh_CN 根据主题选择合适的 logo 图标
 */
const logoSrc = computed(() => {
  // 如果是暗色主题且提供了 logoDark，则使用暗色主题的 logo
  if (isDark.value && props.logoDark) {
    return props.logoDark;
  }
  // 否则使用默认的 logo
  return props.logo;
});
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
</script>

<template>
  <div
<<<<<<< HEAD
    :class="[isDark]"
    class="dark:bg-background-deep auth-background flex min-h-full flex-1 select-none overflow-x-hidden bg-[#e6f3fb]"
=======
    :class="[isDark ? 'dark' : '']"
    class="flex min-h-full flex-1 select-none overflow-x-hidden"
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
  >
    <template v-if="toolbar">
      <slot name="toolbar">
        <Toolbar :toolbar-list="toolbarList" />
      </slot>
    </template>
    <!-- 左侧认证面板 -->
    <AuthenticationFormView
      v-if="authPanelLeft"
      class="min-h-full w-2/5 flex-1"
      data-side="left"
    >
      <template v-if="copyright" #copyright>
        <slot name="copyright">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
        </slot>
      </template>
    </AuthenticationFormView>

    <slot name="logo">
      <!-- 头部 Logo 和应用名称 -->
      <div
<<<<<<< HEAD
        class="text-foreground lg:text-foreground ml-36 mt-16 flex flex-1 items-center sm:left-6 sm:top-6"
      >
        <img
          v-if="logo"
          :alt="appName"
          :src="logo"
          class="mr-2 w-[110px] lg:w-[150px] xl:w-[180px]"
          v-show="!isHideLogo"
        />
        <!-- <p v-if="appName" class="text-xl font-medium">
          {{ appName }}
        </p> -->
=======
        v-if="logoSrc || appName"
        class="absolute left-0 top-0 z-10 flex flex-1"
        @click="clickLogo"
      >
        <div
          class="text-foreground lg:text-foreground ml-4 mt-4 flex flex-1 items-center sm:left-6 sm:top-6"
        >
          <img
            v-if="logoSrc"
            :key="logoSrc"
            :alt="appName"
            :src="logoSrc"
            class="mr-2"
            width="42"
          />
          <p v-if="appName" class="m-0 text-xl font-medium">
            {{ appName }}
          </p>
        </div>
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
      </div>
    </slot>

    <!-- 系统介绍 -->
    <div v-if="!authPanelCenter" class="relative hidden w-0 flex-1 lg:block">
<<<<<<< HEAD
      <div class="absolute inset-0 h-full w-full bg-transparent">
        <div class="absolute left-0 top-0 size-full"></div>
        <div class="flex-col-center -enter-x mr-20 h-full lg:pl-24">
=======
      <div
        class="bg-background-deep absolute inset-0 h-full w-full dark:bg-[#070709]"
      >
        <div class="login-background absolute left-0 top-0 size-full"></div>
        <div
          :key="authPanelLeft ? 'left' : authPanelRight ? 'right' : 'center'"
          class="flex-col-center mr-20 h-full"
          :class="{
            'enter-x': authPanelLeft,
            '-enter-x': authPanelRight,
          }"
        >
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
          <template v-if="sloganImage">
            <img
              :alt="appName"
              :src="sloganImage"
              class="animate-float w-full max-w-[900px]"
            />
          </template>
          <SloganIcon v-else :alt="appName" class="animate-float h-64 w-2/5" />
          <div
            class="mt-6 font-sans text-3xl font-black text-[#0070bb] xl:text-4xl"
          >
            {{ pageTitle }}
            <span class="mt-2 block font-normal xl:mt-0 xl:inline">
              {{ pageDescription }}
            </span>
          </div>
          <!-- <div class="dark:text-muted-foreground mt-2">
            {{ pageDescription }}
          </div> -->
        </div>
      </div>
    </div>

    <!-- 中心认证面板 -->
    <div v-if="authPanelCenter" class="flex-center relative w-full">
      <div class="login-background absolute left-0 top-0 size-full"></div>
      <AuthenticationFormView
        class="md:bg-background shadow-primary/5 shadow-float w-full rounded-3xl pb-20 md:w-2/3 lg:w-1/2 xl:w-[36%]"
        data-side="bottom"
      >
        <template v-if="copyright" #copyright>
          <slot name="copyright">
            <Copyright
              v-if="preferences.copyright.enable"
              v-bind="preferences.copyright"
            />
          </slot>
        </template>
      </AuthenticationFormView>
    </div>

    <!-- 右侧认证面板 -->
    <div
      v-if="authPanelRight"
<<<<<<< HEAD
      class="flex-center relative w-full bg-transparent lg:w-1/2 lg:pr-24 xl:w-[720px] xl:pr-48"
=======
      class="min-h-full w-2/5 flex-1"
      data-side="right"
>>>>>>> 24d20ca9eef853c541422b9ccfa52f75e1f1b34f
    >
      <div class="absolute left-0 top-0 size-full"></div>
      <AuthenticationFormView
        class="md:bg-background shadow-primary/5 shadow-float w-full rounded-3xl pb-20 lg:px-12"
      >
        <img v-if="logo" :alt="appName" :src="logo" class="mb-2 w-[150px]" />

        <template v-if="copyright" #copyright>
          <slot name="copyright">
            <Copyright
              v-if="preferences.copyright.enable"
              v-bind="preferences.copyright"
            />
          </slot>
        </template>
      </AuthenticationFormView>
    </div>
  </div>
</template>

<style scoped>
.login-background {
  background: linear-gradient(
    154deg,
    #07070915 30%,
    hsl(var(--primary) / 30%) 48%,
    #07070915 64%
  );
  filter: blur(100px);
}

.dark {
  .login-background {
    background: linear-gradient(
      154deg,
      #07070915 30%,
      hsl(var(--primary) / 20%) 48%,
      #07070915 64%
    );
    filter: blur(100px);
  }
}

.auth-background {
  width: 100vw;
  height: 100vh;
  background-image: url('https://shop.bjhfbx.cn/qishou/api/swagger/e90e93087bca42c7b9c7c4f27e488ef6.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}
</style>
