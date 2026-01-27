<script lang="ts" setup>
import type { CaseReminderRuleApi } from '#/api/core/case-reminder-rule';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElCheckbox,
  ElCheckboxGroup,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  addReminderRuleApi,
  updateReminderRuleApi,
} from '#/api/core/case-reminder-rule';

interface FormState {
  id?: number;
  title: string;
  description: string;
  reminderText: string;
  importanceLevel: string;
  deadlineHours: number;
  reminderTypes: string[];
  status: number;
}

const emit = defineEmits<{
  register: [];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);

const form = ref<FormState>({
  title: '',
  description: '',
  reminderText: '',
  importanceLevel: '普通',
  deadlineHours: 24,
  reminderTypes: [],
  status: 1,
});

const isEdit = computed(() => !!form.value.id);

// IMPORTANT: Ensure these match the backend expectations (IDs vs Labels)
// Mapping:
// 1: 加速定损
// 2: 尽快联系骑手
// 3: 尽快联系保司
// 4: 加快案件处理

const REMINDER_TYPE_ID_MAP: Record<string, string> = {
  加速定损: '1',
  尽快联系骑手: '2',
  尽快联系保司: '3',
  加快案件处理: '4',
};

const REMINDER_TYPE_LABEL_MAP: Record<string, string> = {
  '1': '加速定损',
  '2': '尽快联系骑手',
  '3': '尽快联系保司',
  '4': '加快案件处理',
};

const IMPORTANCE_LEVEL_MAP: Record<string, number> = {
  普通: 0,
  高: 1,
  最高: 2,
};

const IMPORTANCE_LEVEL_REVERSE_MAP: Record<number, string> = {
  0: '普通',
  1: '高',
  2: '最高',
};

const importanceLevelOptions = [
  { label: '普通', value: '普通' },
  { label: '高', value: '高' },
  { label: '最高', value: '最高' },
];

const reminderTypeOptions = [
  { label: '加速定损', value: '加速定损' },
  { label: '尽快联系骑手', value: '尽快联系骑手' },
  { label: '尽快联系保司', value: '尽快联系保司' },
  { label: '加快案件处理', value: '加快案件处理' },
];

const [Modal, modalApi] = useVbenModal({
  onCancel: () => {
    resetForm();
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      if (!formRef.value) return;
      await formRef.value.validate();
      loading.value = true;

      // Transform form data to API payload
      const payload: CaseReminderRuleApi.TbCaseSettingCb = {
        id: form.value.id,
        title: form.value.title,
        readme: form.value.description,
        comments: form.value.reminderText,
        stopHour: form.value.deadlineHours,
        status: form.value.status,
        imp: IMPORTANCE_LEVEL_MAP[form.value.importanceLevel] ?? 0,
        type: form.value.reminderTypes
          .map((label) => REMINDER_TYPE_ID_MAP[label] || label) // Convert label to ID if possible
          .filter(Boolean)
          .join(','),
      };

      if (isEdit.value) {
        await updateReminderRuleApi(payload);
        ElMessage.success('修改成功');
      } else {
        await addReminderRuleApi(payload);
        ElMessage.success('添加成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData<CaseReminderRuleApi.TbCaseSettingCb>();
      modalApi.setState({
        title: data ? '编辑自动催办规则' : '新建自动催办规则',
      });

      if (data) {
        // Map API data to Form State
        form.value = {
          id: data.id,
          title: data.title || '',
          description: data.readme || '',
          reminderText: data.comments || '',
          deadlineHours: data.stopHour || 24,
          status: data.status || 1,
          importanceLevel:
            IMPORTANCE_LEVEL_REVERSE_MAP[data.imp ?? 0] || '普通',
          reminderTypes:
            data.type
              ?.split(',')
              .map((id) => REMINDER_TYPE_LABEL_MAP[id] || id)
              .filter(Boolean) || [],
        };
      } else {
        resetForm();
      }
    }
  },
});

function resetForm() {
  formRef.value?.resetFields();
  form.value = {
    title: '',
    description: '',
    reminderText: '',
    importanceLevel: '普通',
    deadlineHours: 24,
    reminderTypes: [],
    status: 1,
  };
}
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm ref="formRef" :model="form" label-width="140px">
        <ElFormItem
          label="规则名称"
          prop="title"
          :rules="[
            { required: true, message: '请输入规则名称', trigger: 'blur' },
          ]"
        >
          <ElInput
            v-model="form.title"
            placeholder="输入规则名称"
            maxlength="50"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="规则说明" prop="description">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入规则说明"
            maxlength="500"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="催办备注文字" prop="reminderText">
          <ElInput
            v-model="form.reminderText"
            placeholder="请输入催办备注文字"
            maxlength="100"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="默认重要程度" prop="importanceLevel">
          <ElSelect
            v-model="form.importanceLevel"
            placeholder="请选择重要程度"
            class="!w-full"
          >
            <ElOption
              v-for="option in importanceLevelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem
          label="默认截止时间期限"
          prop="deadlineHours"
          :rules="[
            { required: true, message: '请输入截止时间', trigger: 'blur' },
            { type: 'number', min: 1, message: '至少1小时', trigger: 'blur' },
          ]"
        >
          <ElInputNumber
            v-model="form.deadlineHours"
            :min="1"
            :step="1"
            placeholder="请输入小时数"
            class="!w-full"
          >
            <template #append>小时</template>
          </ElInputNumber>
        </ElFormItem>

        <ElFormItem label="默认催办事件类型" prop="reminderTypes">
          <ElCheckboxGroup v-model="form.reminderTypes">
            <ElCheckbox
              v-for="option in reminderTypeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            >
              {{ option.label }}
            </ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
