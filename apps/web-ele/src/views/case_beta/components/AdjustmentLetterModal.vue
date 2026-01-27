<script lang="ts" setup>
import { ref, watch } from 'vue';

import { useClipboard } from '@vueuse/core';
import { ElButton, ElDialog, ElInput, ElMessage } from 'element-plus';

const props = defineProps<{
  content: string;
  modelValue: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const visible = ref(false);
const text = ref('');
const { copy, isSupported } = useClipboard();

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  },
);

watch(
  () => visible.value,
  (val) => {
    emit('update:modelValue', val);
  },
);

watch(
  () => props.content,
  (val) => {
    text.value = val;
  },
  { immediate: true },
);

const handleCopy = async () => {
  if (!isSupported) {
    ElMessage.error('当前浏览器不支持复制功能');
    return;
  }
  await copy(text.value);
  ElMessage.success('复制成功');
};

const handleSave = () => {
  // Emit save event with the current text
  emit('save', text.value);
};
</script>

<template>
  <ElDialog
    v-model="visible"
    title="理算书编辑器"
    width="800px"
    top="5vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="flex flex-col gap-4">
      <div class="rounded bg-blue-50 p-3 text-sm text-blue-600">
        <p class="font-bold">模板及说明：</p>
        <p>1. 文本框内已自动生成模板内容，可直接修改。</p>
        <p>2. 点击【复制文字】可将内容复制到剪贴板，发送给骑手。</p>
        <p>3. 点击【更新理算书】可保存当前修改。</p>
      </div>

      <ElInput
        v-model="text"
        type="textarea"
        :rows="15"
        :readonly="readonly"
        placeholder="理算书内容..."
        class="font-mono text-sm leading-relaxed"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="visible = false">关闭</ElButton>
        <ElButton type="primary" plain @click="handleCopy"> 复制文字 </ElButton>
        <ElButton v-if="!readonly" type="primary" @click="handleSave">
          更新理算书
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
