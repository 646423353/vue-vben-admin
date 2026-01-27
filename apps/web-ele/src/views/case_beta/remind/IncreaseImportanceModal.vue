<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElRadio, ElRadioGroup } from 'element-plus';

import { increaseReminderImportanceApi } from '#/api/core/case-reminder';

defineOptions({ name: 'IncreaseImportanceModal' });

const props = defineProps<Props>();

const emit = defineEmits<{
  cancel: [];
  success: [value: number];
}>();

interface Props {
  currentImportance: number;
}

const reminderId = ref<number>();
const selectedImportance = ref<number>();

// 根据当前重要程度生成可选项
const options = computed(() => {
  const opts: { label: string; value: number }[] = [];
  if (props.currentImportance < 2) {
    opts.push({ label: '高', value: 2 });
  }
  if (props.currentImportance < 3) {
    opts.push({ label: '最高', value: 3 });
  }
  return opts;
});

const getImpText = (imp: number) => {
  if (imp === 3) return '最高';
  if (imp === 2) return '高';
  return '普通';
};

const [Modal, modalApi] = useVbenModal({
  title: '提高重要程度',
  fullscreenButton: false,
  closeOnClickModal: false,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      selectedImportance.value = undefined;
    }
  },
});

async function handleSubmit() {
  try {
    if (!selectedImportance.value) {
      throw new Error('请选择重要程度');
    }
    if (!reminderId.value) {
      throw new Error('缺少催办记录ID');
    }

    modalApi.setState({ loading: true, confirmLoading: true });
    await increaseReminderImportanceApi({
      id: reminderId.value,
      imp: selectedImportance.value,
    });
    ElMessage.success('提高重要程度成功');
    emit('success', selectedImportance.value);
    modalApi.close();
  } catch (error: any) {
    if (typeof error === 'string') {
      ElMessage.error(error);
    } else if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    modalApi.setState({ loading: false, confirmLoading: false });
  }
}

defineExpose({
  handleSubmit,
  modalApi,
  reminderId,
});
</script>

<template>
  <Modal>
    <div class="p-5">
      <div class="mb-5">
        <p class="mb-2 text-sm text-gray-600">
          当前重要程度：<span class="font-semibold">{{
            getImpText(currentImportance)
          }}</span>
        </p>
        <p class="mb-4 text-sm text-gray-600">请选择新的重要程度：</p>
      </div>

      <ElRadioGroup v-model="selectedImportance" class="flex flex-row gap-4">
        <ElRadio
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          class="!ml-0"
        >
          {{ opt.label }}
        </ElRadio>
      </ElRadioGroup>
    </div>
  </Modal>
</template>
