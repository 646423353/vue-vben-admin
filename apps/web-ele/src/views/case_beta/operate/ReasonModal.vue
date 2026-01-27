<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';

const emit = defineEmits(['success']);

const options = ref<{ label: string; value: string }[]>([]);
const selectedValues = ref<string[]>([]);
const inputValue = ref('');
const title = ref('');
const type = ref(''); // 'exception', 'block', 'back', 'close'
const mode = ref<'input' | 'select'>('select');
const label = ref('');

const [Modal, modalApi] = useVbenModal({
  onConfirm: () => {
    let value: string | string[] = '';
    if (mode.value === 'select') {
      if (selectedValues.value.length === 0) {
        ElMessage.warning('请至少选择一项');
        return;
      }
      value = selectedValues.value;
    } else {
      if (!inputValue.value.trim()) {
        ElMessage.warning('请输入内容');
        return;
      }
      value = inputValue.value;
    }

    // Emit success with type and values (compatible with generic handling)
    emit('success', { type: type.value, value });
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<any>();
      options.value = data.options || [];
      title.value = data.title || '请选择';
      type.value = data.type || '';
      mode.value = data.mode || 'select';
      label.value = data.label || '';
      selectedValues.value = [];
      inputValue.value = '';
    }
  },
});
</script>

<template>
  <Modal :title="title">
    <div class="p-4">
      <div v-if="label" class="mb-2 text-gray-600">
        {{ label }}
      </div>
      <div v-else class="mb-2 text-gray-600">
        {{
          mode === 'select'
            ? `请选择${title}原因标签（可多选）：`
            : `请输入${title}备注：`
        }}
      </div>

      <ElSelect
        v-if="mode === 'select'"
        v-model="selectedValues"
        class="w-full"
        collapse-tags
        multiple
        placeholder="请选择"
      >
        <ElOption
          v-for="opt in options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <ElInput
        v-else
        v-model="inputValue"
        :rows="4"
        placeholder="请输入内容"
        type="textarea"
      />
    </div>
  </Modal>
</template>
