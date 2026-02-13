<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Loading } from '@element-plus/icons-vue';
import { useDebounceFn, useVModel } from '@vueuse/core';
import { ElIcon, ElSelectV2 } from 'element-plus';

import { OrderListApi } from '#/api/core/order';

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: undefined,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const value = useVModel(props, 'modelValue', emit);
const options = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const keyword = ref('');
const size = 100;

const fetchOrderList = async (isLoadMore = false) => {
  if (loading.value) return;

  // If loading more, ensure we have more data to load
  if (isLoadMore && options.value.length >= total.value) return;

  loading.value = true;

  // Add loading option
  const loadingOption = { value: -1, label: '加载中...', orderId: '加载中...' };
  if (isLoadMore) {
    options.value.push(loadingOption);
  }

  try {
    const { list, total: totalCount } = await OrderListApi(
      {
        orderId: keyword.value,
      },
      {
        page: page.value,
        size,
      },
    );

    // Remove loading option before adding new data
    if (
      isLoadMore &&
      options.value.length > 0 &&
      options.value[options.value.length - 1].value === -1
    ) {
      options.value.pop();
    }

    const newOptions = list.map((item) => ({
      label: item.orderId,
      value: item.id,
    }));

    if (isLoadMore) {
      options.value.push(...newOptions);
    } else {
      options.value = newOptions;
    }
    total.value = totalCount;

    // Re-attach scroll listener after DOM update (Virtual list might replace container)
    // Use nextTick and a small delay to ensure virtual list has re-rendered
    setTimeout(() => {
      setupScrollListener(true);
    }, 200);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = (query: string) => {
  // If query is empty and we have initial options, we might just want to show them?
  // But standard remote behavior is to fetch.
  // Cache check: exact match and we are on page 1 (or have loaded some data for this query)
  // If query changed, we must reset.
  // If query changed, we must reset and fetch.
  // If query is the same, only fetch if options are empty (e.g., initial load or cleared).
  if (query !== keyword.value) {
    keyword.value = query;
    page.value = 1;
    options.value = []; // Clear options to avoid "onMouseUp" error on rapid switching? Or keep them?
    // Clearing options usually prevents virtual list index out of bounds errors.
    fetchOrderList();
  } else if (options.value.length === 0) {
    page.value = 1;
    fetchOrderList();
  }
  // Else: query is same and options are not empty, do nothing (cache hit)
};

const debouncedSearch = useDebounceFn(handleSearch, 300);

const loadMore = () => {
  if (options.value.length >= total.value || loading.value) return;
  page.value++;
  fetchOrderList(true);
};

// Check if we need to emit change event manually if ElSelectV2 doesn't (it usually does)
const handleChange = (val: any) => {
  emit('change', val);
};

const instanceId = Math.random().toString(36).slice(2, 9);
const popperClass = `order-select-popper-${instanceId}`;

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target) return;
  const { scrollTop, clientHeight, scrollHeight } = target;
  // Use a smaller threshold or verify logic
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMore();
  }
};

/**
 * Recursively find the element with overflow-y: auto or scroll
 */
const findScrollElement = (element: Element | null): Element | null => {
  if (!element) return null;
  const style = window.getComputedStyle(element);
  if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
    return element;
  }
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (child) {
      const found = findScrollElement(child);
      if (found) return found;
    }
  }
  return null;
};

const setupScrollListener = (visible: boolean) => {
  if (visible) {
    // Slight delay to ensure DOM is rendered
    setTimeout(() => {
      // Find the popper container
      const popper = document.querySelector(`.${popperClass}`);
      if (!popper) return;

      // Try to find the scrollable element dynamically
      const scrollContainer = findScrollElement(popper);

      if (scrollContainer) {
        // Remove previous listener just in case to avoid duplicates
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.addEventListener('scroll', handleScroll);
      }
    }, 200);
  }
};

onMounted(() => {
  fetchOrderList();
});
</script>

<template>
  <ElSelectV2
    v-model="value"
    :options="options"
    :loading="page === 1 && loading"
    :multiple="multiple"
    :placeholder="placeholder"
    filterable
    remote
    :remote-method="debouncedSearch"
    @change="handleChange"
    @visible-change="setupScrollListener"
    :popper-class="popperClass"
    clearable
    style="width: 100%"
  >
    <template #default="{ item }">
      <div
        v-if="item.value === -1"
        class="flex h-full w-full items-center justify-center text-xs text-gray-400"
      >
        <ElIcon class="is-loading mr-1"><Loading /></ElIcon>
        加载中...
      </div>
      <span v-else>{{ item.label }}</span>
    </template>
  </ElSelectV2>
</template>
