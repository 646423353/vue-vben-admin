<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';

const emit = defineEmits(['success']);

const options = ref<{ label: string; value: string }[]>([]);
const selectedValues = ref<string | string[]>([]);
const inputValue = ref('');
const title = ref('');
const type = ref(''); // 'exception', 'block', 'back', 'close'
const mode = ref<'input' | 'select' | 'select_and_input'>('select');
const label = ref('');
const inputLabel = ref('');

const [Modal, modalApi] = useVbenModal({
  onConfirm: () => {
    let value: string | string[] = '';
    let textValue = '';

    switch (mode.value) {
      case 'input': {
        if (!inputValue.value.trim()) {
          ElMessage.warning('请输入内容');
          return;
        }
        value = inputValue.value;

        break;
      }
      case 'select': {
        if (!selectedValues.value || selectedValues.value.length === 0) {
          ElMessage.warning('请至少选择一项');
          return;
        }
        value = selectedValues.value;

        break;
      }
      case 'select_and_input': {
        if (!selectedValues.value || selectedValues.value.length === 0) {
          ElMessage.warning('请至少选择一项原因');
          return;
        }
        // 对于结案，允许单选或多选。由模板上的 multiple 属性控制
        value = selectedValues.value;
        textValue = inputValue.value;

        break;
      }
      // No default
    }

    // Emit success with type and values (compatible with generic handling)
    emit('success', { type: type.value, value, textValue });
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
      inputLabel.value = data.inputLabel || '';
      // 若支持单选（如close），则设为空字符串，否则空数组
      selectedValues.value = data.multiple === false ? '' : [];
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
      <div v-else-if="mode === 'select'" class="mb-2 text-gray-600">
        {{ title }}原因（可多选）：
      </div>
      <div v-else-if="mode === 'input'" class="mb-2 text-gray-600">
        {{ title }}备注：
      </div>
      <div v-else-if="mode === 'select_and_input'" class="mb-2 text-gray-600">
        {{ title }}原因：
      </div>

      <ElSelect
        v-if="mode === 'select' || mode === 'select_and_input'"
        v-model="selectedValues"
        class="mb-4 w-full"
        collapse-tags
        :multiple="Array.isArray(selectedValues)"
        placeholder="请选择"
      >
        <ElOption
          v-for="opt in options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <div v-if="mode === 'select_and_input'" class="mb-2 text-gray-600">
        {{ inputLabel || '请输入备注：' }}
      </div>

      <ElInput
        v-if="mode === 'input' || mode === 'select_and_input'"
        v-model="inputValue"
        :rows="4"
        placeholder="请输入内容"
        type="textarea"
      />
    </div>
  </Modal>
</template>
