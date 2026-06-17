import { computed, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { CustomerListApi } from '#/api/core/customer';

/**
 * 专用于管理和缓存当前登录用户的客户权限范围
 */
export const useUserCustomerStore = defineStore('user-customer', () => {
  const userStore = useUserStore();
  const customerIds = ref<number[]>([]);
  const isLoaded = ref(false);
  const loading = ref(false);

  // 判断是否属于理赔限制角色
  const isClaimsLimitRole = computed(() => {
    const roleName =
      userStore.userInfo?.roleName || userStore.userInfo?.roleNames || '';
    return ['初审及保司对接员', '理赔管理员'].includes(roleName);
  });

  // 获取该账号关联的客户 ID 列表
  async function fetchUserCustomers() {
    if (!isClaimsLimitRole.value) {
      customerIds.value = [];
      isLoaded.value = true;
      return;
    }
    if (isLoaded.value || loading.value) return;

    loading.value = true;
    try {
      const uid = userStore.userInfo?.id;
      if (uid) {
        // 传递明确的 uid 避开全局拦截器可能引发的循环调用
        const { list } = await CustomerListApi(
          { uid: String(uid) },
          {
            page: 1,
            size: 2000,
            withTag: 0,
            withStop: 0,
            withInsure: 0,
          },
        );
        customerIds.value = (list || []).map((item) => Number(item.id));
      }
      isLoaded.value = true;
    } catch (error) {
      console.error('获取关联客户列表失败:', error);
    } finally {
      loading.value = false;
    }
  }

  // 辅助方法：过滤得到最终发包给后端的逗号分割客户 ID 字符串参数
  async function getCustomerParamValue(currentVal: string | undefined) {
    if (!isClaimsLimitRole.value) {
      return currentVal;
    }

    // 确保已拉取过关联客户列表
    if (!isLoaded.value) {
      await fetchUserCustomers();
    }

    const authorized = customerIds.value;

    if (currentVal) {
      // 当前表单中有传参数（通常是多选 join(',') 拼接的字符串）
      const formIds = String(currentVal)
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !Number.isNaN(id));

      // 取与被授权客户的交集，杜绝越权
      const intersect = formIds.filter((id) => authorized.includes(id));
      return intersect.length > 0 ? intersect.join(',') : '-1';
    }

    // 表单未选择任何客户，静默限制为所有该账号有权限的客户
    return authorized.length > 0 ? authorized.join(',') : '-1';
  }

  return {
    customerIds,
    isLoaded,
    isClaimsLimitRole,
    fetchUserCustomers,
    getCustomerParamValue,
  };
});
