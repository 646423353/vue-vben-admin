<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import UpdateAvatar from './update-avatar.vue';
import UpdateInfo from './update-info.vue';
import UpdatePassword from './update-password.vue';

const updatePasswordRef = ref();
const userStore = useUserStore();
const activeTab = ref('1');
const handleChange = (key: any) => {
  if (key === '2') {
    // 重置校验
    updatePasswordRef.value?.getFormApi()?.resetValidate();
  }
};
</script>
<template>
  <Page>
    <div class="grid grid-cols-3 gap-4">
      <ElCard class="col-span-1">
        <div class="flex justify-center">
          <UpdateAvatar :avatar="userStore.userInfo?.file" />
        </div>
        <div class="flex justify-center p-[8px]">
          {{ userStore.userInfo?.description }}
        </div>
        <ElDescriptions :column="1" border class="mt-6" label-width="30%">
          <ElDescriptionsItem label="登录名">
            {{ userStore.userInfo?.username }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="昵称">
            {{ userStore.userInfo?.description }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="权限">
            {{
              userStore.userInfo?.roleId === 13
                ? '管理员'
                : userStore.userInfo?.roleId === 14
                  ? '业务主管'
                  : '业务操作员'
            }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>
      <ElCard class="col-span-2">
        <ElTabs v-model="activeTab" @change="handleChange">
          <ElTabPane label="基本信息" name="1">
            <UpdateInfo />
          </ElTabPane>
          <ElTabPane label="修改密码" name="2">
            <UpdatePassword ref="updatePasswordRef" />
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </Page>
</template>
<style lang="less" scoped></style>
