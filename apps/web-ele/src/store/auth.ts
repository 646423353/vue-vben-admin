import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import {
  resetAllStores,
  useAccessStore,
  useTabbarStore,
  useUserIdStore,
  useUserStore,
} from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const userIdStore = useUserIdStore();
  const router = useRouter();
  const tabbarStore = useTabbarStore();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { id, token } = await loginApi(params);

      // 如果成功获取到 accessToken
      if (token) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(token);

        // 获取用户信息并存储到 accessStore 中      accessCodes
        const [fetchUserInfoResult] = await Promise.all([
          fetchUserInfo(id),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userIdStore.setUserId(userInfo.id);
        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes([`${userInfo.roleId}`]);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    // Explicitly reset tabbar store and clear storage BEFORE navigation to avoid persistence issues
    // Manually empty tabs to ensure no persistence of old state
    tabbarStore.tabs = [];
    tabbarStore.$reset();

    // Fuzzy remove keys related to tabbar from sessionStorage
    // Key format is usually: {namespace}-{version}-{env}-core-tabbar
    Object.keys(sessionStorage).forEach((key) => {
      if (key.includes('core-tabbar')) {
        sessionStorage.removeItem(key);
      }
    });

    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo(id: number) {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi(id);
    userInfo.roles = [userInfo.roleNames];

    // Set home path for claims roles
    const claimsRoles = [
      '理赔客服',
      '定损员',
      '初审及保司对接员',
      '理赔管理员',
    ];
    if (claimsRoles.includes(userInfo.roleNames)) {
      userInfo.homePath = '/claims-home/index';
      // Manually pin the tab for claims users
      const route = router.resolve('/claims-home/index');
      tabbarStore.addTab({
        ...route,
        name: route.name as string,
        path: route.path,
        fullPath: route.fullPath,
        meta: {
          ...route.meta,
          title: '工作台',
          affixTab: true,
        },
      } as any);
    } else {
      // For other roles (presumably admins/managers), pin Dashboard manually
      // This replaces the static affixTab: true in dashboard.ts
      const route = router.resolve('/dashboard/analytics');
      tabbarStore.addTab({
        ...route,
        name: route.name as string,
        path: route.path,
        fullPath: route.fullPath,
        meta: {
          ...route.meta,
          title: $t('page.dashboard.title'),
          affixTab: true,
        },
      } as any);
    }

    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});

export { useUserStore };
