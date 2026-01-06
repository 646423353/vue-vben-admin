<script lang="ts" setup>
import type { CaseApi } from '#/api/core/case';

import { onMounted, ref, watch } from 'vue';

import { ElPagination, ElTimeline, ElTimelineItem } from 'element-plus';
import moment from 'moment';

import { CaseCommentGetApi } from '#/api/core/case';

interface Props {
  caseId: number | string;
  isHandle?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:total']);

const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const logList = ref<CaseApi.CommentInfo[]>([]);
const total = ref(0);

const getStatusText = (status: number | string) => {
  const statusMap = {
    1: '结案',
    2: '理赔待处理',
    3: '保险公司定损',
    4: '待诉讼',
    5: '诉讼',
    6: '协议文件',
    7: '公司盖章',
    8: '待打款',
    9: '资料收集',
    10: '待骑手提供资料',
    11: '劳动仲裁',
    12: '死亡案件',
  };
  return statusMap[status as keyof typeof statusMap] || '';
};

const fetchLogs = async () => {
  if (!props.caseId) return;
  loading.value = true;
  try {
    const res = await CaseCommentGetApi(
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
            class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="font-bold text-gray-900">{{ log.username }}</span>
              <span
                class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
              >
                {{ log.roleName || '系统用户' }}
              </span>
              <span
                v-if="log.status"
                class="ml-auto text-sm font-medium text-blue-600"
              >
                {{ getStatusText(log.status) }}
              </span>
            </div>

            <div class="text-sm leading-relaxed text-gray-700">
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
