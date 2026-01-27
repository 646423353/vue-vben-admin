<script lang="ts" setup>
import type { TbCaseLog } from '#/api/core/case-record';

import { onMounted, ref, watch } from 'vue';

import { ElPagination, ElTimeline, ElTimelineItem } from 'element-plus';
import moment from 'moment';

import { CaseLogApi } from '#/api/core/case-record';

interface Props {
  caseId: number | string;
  isHandle?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:total']);

const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const logList = ref<TbCaseLog[]>([]);
const total = ref(0);

// Status mapping removed as it's not in the new interface

const fetchLogs = async () => {
  if (!props.caseId) return;
  loading.value = true;
  try {
    const res = await CaseLogApi(
      props.caseId,
      currentPage.value,
      pageSize.value,
    );
    logList.value = res.list;
    total.value = res.total;
    emit('update:total', res.total);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchLogs();
};

watch(
  () => props.caseId,
  async (newId) => {
    if (newId) {
      fetchLogs();
    }
  },
  {
    immediate: true,
  },
);

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="case-comm-log p-4">
    <!-- Money Info Section -->

    <!-- Timeline Log Section -->
    <div v-loading="loading" class="log-list">
      <div
        v-if="logList.length === 0"
        class="flex min-h-[300px] items-center justify-center text-gray-400"
      >
        暂无处理日志
      </div>
      <ElTimeline v-else>
        <ElTimelineItem
          v-for="(log, index) in logList"
          :key="index"
          :timestamp="moment(log.created).format('YYYY-MM-DD HH:mm:ss')"
          placement="top"
          :color="index === 0 ? '#10b981' : '#e5e7eb'"
        >
          <div
            class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
          >
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="font-bold text-gray-900 dark:text-gray-100">{{
                log.username
              }}</span>
            </div>

            <div
              class="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
            >
              {{ log.content }}
            </div>
          </div>
        </ElTimelineItem>
      </ElTimeline>
    </div>

    <!-- Pagination -->
    <div v-if="total > 0" class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.el-timeline-item__node--normal) {
  left: 0;
  width: 10px;
  height: 10px;
}

:deep(.el-timeline-item__tail) {
  left: 4px;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 24px;
}
</style>
