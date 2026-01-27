<script lang="ts" setup>
import type { TbCaseUserTimelineDeal } from '#/api/core/case-timeline';

import { onMounted, ref, watch } from 'vue';

import { getTimelineDealApi } from '#/api/core/case-timeline';

interface Props {
  timelineId: number | string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'hasData', value: boolean): void;
}>();

const dealList = ref<TbCaseUserTimelineDeal[]>([]);
const loading = ref(false);

const fetchDealHistory = async () => {
  if (!props.timelineId) return;
  loading.value = true;
  try {
    const res = await getTimelineDealApi({
      id: props.timelineId,
      page: 1,
      size: 20,
    });
    dealList.value = res.list || [];
    emit('hasData', dealList.value.length > 0);
  } catch (error) {
    console.error('Failed to fetch timeline deal history:', error);
    emit('hasData', false);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDealHistory();
});

watch(
  () => props.timelineId,
  () => {
    fetchDealHistory();
  },
);

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 格式化操作内容
const formatDealContent = (deal: TbCaseUserTimelineDeal) => {
  const comment = deal.comments || '';
  const value = deal.nowvalue;

  // 1. 特殊字段：修改主体、修改图片 -> 不显示值
  if (comment.includes('修改主体') || comment.includes('修改图片')) {
    return comment;
  }

  // 2. 特殊字段：证件类型 -> 映射值
  if (comment.includes('证件类型')) {
    const map: Record<string, string> = {
      '0': '身份证',
      '1': '企业信用代码',
    };
    const label = map[String(value)] || value;
    return `${comment}：${label}`;
  }

  // 3. 默认情况
  return `${comment}：${value}`;
};
</script>

<template>
  <div v-if="dealList.length > 0" class="space-y-2">
    <div
      v-for="deal in dealList"
      :key="deal.id"
      class="text-sm text-gray-600 dark:text-gray-300"
    >
      <div class="flex items-start gap-2">
        <span class="whitespace-nowrap text-gray-400">
          {{ formatDate(deal.created) }}
        </span>
        <span class="flex-1">{{ formatDealContent(deal) }}</span>
      </div>
    </div>
  </div>
  <div v-else-if="!loading" class="text-sm text-gray-400">暂无修改记录</div>
</template>
