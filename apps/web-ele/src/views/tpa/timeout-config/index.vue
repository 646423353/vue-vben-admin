<script lang="ts" setup>
import type { Component } from 'vue';

import type { CaseTimeoutApi } from '#/api/core/case-timeout';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { AntdAlert, AntdClockCircle, AntdUser, AntdWarning } from '@vben/icons';

import { ElButton, ElCard, ElIcon } from 'element-plus';

import { getTimeoutListApi } from '#/api/core/case-timeout';

import TimeoutConfigModal from './TimeoutConfigModal.vue';

interface TimeoutParam {
  label: string;
  icon: Component;
  description: string;
}

const loading = ref(false);
const configMap = ref<Record<string, CaseTimeoutApi.TbCaseSettingTimeout>>({});

const [Modal, modalApi] = useVbenModal({
  connectedComponent: TimeoutConfigModal,
});

const paramList: TimeoutParam[] = [
  {
    label: '总用时超时',
    icon: AntdClockCircle,
    description: '案件从创建到完成的总用时超时阈值',
  },
  {
    label: '总用时严重超时',
    icon: AntdWarning,
    description: '案件从创建到完成的总用时严重超时阈值',
  },
  {
    label: '当前对接超时',
    icon: AntdUser,
    description: '案件当前处理人对接超时阈值',
  },
  {
    label: '当前对接严重超时',
    icon: AntdAlert,
    description: '案件当前处理人对接严重超时阈值',
  },
];

const loadConfig = async () => {
  loading.value = true;
  try {
    const res = await getTimeoutListApi({ status: 1 });
    if (res) {
      const map: Record<string, CaseTimeoutApi.TbCaseSettingTimeout> = {};
      res.forEach((item) => {
        if (item.title) {
          map[item.title] = item;
        }
      });
      configMap.value = map;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (param: TimeoutParam) => {
  const item = configMap.value[param.label];
  if (item) {
    modalApi.setData(item);
    modalApi.open();
  }
};

const handleSuccess = () => {
  loadConfig();
};

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <Page title="超时参数配置">
    <ElCard class="!rounded-lg border-none shadow-sm" v-loading="loading">
      <div class="space-y-4">
        <div
          v-for="param in paramList"
          :key="param.label"
          class="group cursor-pointer rounded-lg border border-gray-100 bg-white p-6 transition-all duration-200 hover:border-primary hover:shadow-md dark:border-gray-700 dark:bg-slate-800 dark:hover:border-primary"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-1 items-center gap-4">
              <!-- Icon -->
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20"
              >
                <ElIcon :size="24">
                  <component :is="param.icon" />
                </ElIcon>
              </div>

              <!-- Content -->
              <div class="flex-1">
                <div class="mb-1 flex items-baseline gap-3">
                  <span
                    class="text-base font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {{ param.label }}
                  </span>
                  <span class="text-3xl font-bold text-primary">
                    {{ configMap[param.label]?.hours || 0 }}
                  </span>
                  <span class="text-sm font-medium text-gray-500">小时</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ param.description }}
                </p>
              </div>
            </div>

            <!-- Action Button -->
            <ElButton
              type="primary"
              class="ml-4"
              @click.stop="handleEdit(param)"
            >
              修改
            </ElButton>
          </div>
        </div>
      </div>
    </ElCard>

    <Modal @success="handleSuccess" />
  </Page>
</template>
