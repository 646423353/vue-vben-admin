<script lang="ts" setup>
import type { CaseAlarmApi } from '#/api/core/case-alarm';

import { onMounted, ref } from 'vue';

import { AntdPlusOutlined } from '@vben/icons';

import {
  ElButton,
  ElIcon,
  ElMessage,
  ElMessageBox,
  ElScrollbar,
  ElTag,
} from 'element-plus';

import {
  deleteRiskRuleApi,
  getRiskRulesApi,
  updateRiskRuleApi,
} from '#/api/core/case-alarm';

const emit = defineEmits(['create', 'edit']);

const loading = ref(false);
const noMore = ref(false);
const list = ref<CaseAlarmApi.TbCaseSettingRules[]>([]);
const page = ref(1);
const size = 10;
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>();

async function loadData() {
  if (loading.value || noMore.value) return;
  loading.value = true;
  try {
    const res = await getRiskRulesApi({ page: page.value, size });
    if (res && res.list) {
      if (res.list.length < size) {
        noMore.value = true;
      }
      list.value.push(...res.list);
      page.value++;
    } else {
      noMore.value = true;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleScroll({ scrollTop }: { scrollTop: number }) {
  if (loading.value || noMore.value) return;
  const wrap = scrollbarRef.value?.wrapRef;
  if (!wrap) return;
  const { clientHeight, scrollHeight } = wrap;
  // Threshold 50px
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadData();
  }
}

function handleCreate() {
  emit('create');
}

function handleEdit(item: CaseAlarmApi.TbCaseSettingRules) {
  emit('edit', item);
}

function handleDelete(item: CaseAlarmApi.TbCaseSettingRules) {
  if (!item.id) return;
  ElMessageBox.confirm('确认停用该规则吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteRiskRuleApi(item.id!);
    ElMessage.success('停用成功');
    reload();
  });
}

function handleEnable(item: CaseAlarmApi.TbCaseSettingRules) {
  if (!item.id) return;
  ElMessageBox.confirm('确认启用该规则吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
  }).then(async () => {
    await updateRiskRuleApi({ id: item.id!, status: 1 });
    ElMessage.success('启用成功');
    reload();
  });
}

function reload() {
  page.value = 1;
  list.value = [];
  noMore.value = false;
  loadData();
}

// Initial load
onMounted(() => {
  loadData();
});

defineExpose({ reload });
</script>

<template>
  <div class="px-2 py-4">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="h-5 w-1 rounded-full bg-blue-600"></div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
          设置风险预警规则
        </h2>
      </div>
      <ElButton type="primary" class="!rounded-lg" @click="handleCreate">
        <ElIcon class="mr-1"><AntdPlusOutlined /></ElIcon>
        新建规则
      </ElButton>
    </div>

    <!-- Infinite Scroll Container -->
    <ElScrollbar
      ref="scrollbarRef"
      height="calc(100vh - 180px)"
      @scroll="handleScroll"
    >
      <div class="space-y-4 pr-4">
        <div
          v-for="item in list"
          :key="item.id"
          class="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md dark:border-gray-700 dark:bg-slate-800 dark:hover:border-blue-900"
        >
          <!-- Status Strip -->
          <div
            class="absolute bottom-0 left-0 top-0 w-1 transition-colors duration-300"
            :class="
              item.status === 1
                ? 'bg-green-500'
                : 'bg-gray-300 dark:bg-gray-600'
            "
          ></div>

          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="text-base font-bold text-gray-900 dark:text-gray-100"
                >{{ item.title || '未命名规则' }}</span
              >
              <!-- Status Badge -->
              <ElTag
                :type="item.status === 1 ? 'success' : 'info'"
                size="small"
              >
                {{ item.status === 1 ? '启用' : '停用' }}
              </ElTag>
            </div>
            <!-- Edit/Delete Actions -->
            <div
              class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ElButton link type="primary" @click="handleEdit(item)">
                编辑
              </ElButton>
              <ElButton
                v-if="item.status === 1"
                link
                type="danger"
                @click="handleDelete(item)"
              >
                停用
              </ElButton>
              <ElButton v-else link type="success" @click="handleEnable(item)">
                启用
              </ElButton>
            </div>
          </div>

          <div class="space-y-3 pl-1">
            <div class="flex items-start gap-4">
              <span
                class="w-20 shrink-0 pt-2 text-sm text-gray-500 dark:text-gray-400"
                >计算规则</span
              >
              <div
                class="flex-1 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 dark:bg-slate-700 dark:text-gray-200"
              >
                {{ item.funct || '-' }}
              </div>
            </div>
            <div class="flex items-start gap-4">
              <span
                class="w-20 shrink-0 pt-1 text-sm text-gray-500 dark:text-gray-400"
                >提示文字</span
              >
              <span class="py-1 text-sm font-medium text-red-500">
                {{ item.comments || '-' }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="loading" class="py-4 text-center text-gray-500">
          加载中...
        </div>
        <div
          v-if="noMore && list.length > 0 && page > 2"
          class="py-4 text-center text-gray-400"
        >
          没有更多了
        </div>
        <div
          v-if="!loading && list.length === 0"
          class="py-8 text-center text-gray-400"
        >
          暂无数据
        </div>
      </div>
    </ElScrollbar>
  </div>
</template>
