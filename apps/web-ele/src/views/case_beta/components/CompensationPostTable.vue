<script lang="ts" setup>
import type { TbCasePeifu, TbCasePeifuPost } from '#/api/core/case-peifu';

import { onMounted, ref, watch } from 'vue';

import { ElLink } from 'element-plus';
import moment from 'moment';

import { getCasePeifuPostListApi } from '#/api/core/case-peifu';

const props = defineProps<{
  commentData: TbCasePeifu;
}>();

const emit = defineEmits(['latestTime']);

const list = ref<TbCasePeifuPost[]>([]);
const loading = ref(false);

const labels: Record<number, string> = {
  1: '初步协商一致',
  2: '协商异常',
  3: '协商一致',
  4: '无法联系',
  5: '其他情况',
};

const getMethodLabel = (method?: number) => {
  return method ? labels[method] || '未知' : '---';
};

const formatTime = (time?: number | string) => {
  if (!time) return '---';
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
};
// ... (labels and helper functions)

const parseAttachments = (jsonStr?: string) => {
  if (!jsonStr) return [];
  try {
    const res = JSON.parse(jsonStr);
    if (Array.isArray(res)) return res;
    return [];
  } catch {
    return [];
  }
};

const fetchData = async () => {
  if (!props.commentData?.id) return;
  loading.value = true;
  try {
    const res = await getCasePeifuPostListApi({
      tid: props.commentData.id,
      page: 1,
      size: 20,
    });
    list.value = res.list || [];

    // Calculate latest time
    if (list.value.length > 0) {
      const times = list.value
        .map((item) => new Date(item.created || 0).getTime())
        .filter((t) => !Number.isNaN(t));
      if (times.length > 0) {
        const maxTime = Math.max(...times);
        emit('latestTime', maxTime);
      }
    }
  } catch (error) {
    console.error('Failed to fetch negotiation posts:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

watch(
  () => props.commentData,
  () => {
    fetchData();
  },
);

defineExpose({
  refresh: fetchData,
});
</script>

<template>
  <div v-loading="loading" class="bg-white text-sm dark:bg-slate-800">
    <div v-if="list.length > 0">
      <div
        v-for="item in list"
        :key="item.id"
        class="flex flex-col border-b border-gray-100 bg-white hover:bg-gray-50 sm:flex-row dark:border-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <!-- Time -->
        <div
          class="w-full border-gray-100 p-3 text-gray-500 sm:w-40 sm:border-r dark:border-gray-700 dark:text-gray-400"
        >
          {{ formatTime(item.created) }}
        </div>
        <!-- Method -->
        <div
          class="w-full border-gray-100 p-3 font-medium text-gray-700 sm:w-36 sm:border-r dark:border-gray-700 dark:text-gray-300"
        >
          {{ getMethodLabel(item.method) }}
        </div>
        <!-- Content -->
        <div class="flex-1 p-3 text-gray-800 dark:text-gray-100">
          <div>{{ item.content || '---' }}</div>
          <!-- Attachments -->
          <div v-if="item.attatchs" class="mt-2 text-xs text-gray-400">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(file, idx) in parseAttachments(item.attatchs)"
                :key="idx"
              >
                <ElLink
                  v-if="file.url"
                  type="primary"
                  :href="file.url"
                  target="_blank"
                  underline="never"
                >
                  {{
                    (file.name || `图片${idx + 1}`).length > 20
                      ? `${(file.name || `图片${idx + 1}`).slice(0, 20)}...`
                      : file.name || `图片${idx + 1}`
                  }}
                </ElLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-slate-800">
      <div class="flex h-16 items-center justify-center text-sm text-gray-400">
        暂无协商记录
      </div>
    </div>
  </div>
</template>
