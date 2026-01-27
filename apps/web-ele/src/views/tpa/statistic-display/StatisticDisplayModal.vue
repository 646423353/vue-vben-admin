<script lang="ts" setup>
import type { CaseStatisticsRuleApi } from '#/api/core/case-statistics-rule';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

import {
  addStatisticRuleApi,
  updateStatisticRuleApi,
} from '#/api/core/case-statistics-rule';

interface FormState {
  id?: number;
  name: string; // 统计形式名称 -> title
  description: string; // 统计规则说明 -> readme
  displayStyle: string; // 预期展示样式 -> comments
  status: number;
}

const emit = defineEmits<{
  register: [];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);

const form = ref<FormState>({
  name: '',
  description: '',
  displayStyle: '',
  status: 1,
});

const isEdit = computed(() => !!form.value.id);

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

      const payload: CaseStatisticsRuleApi.TbCaseSettingTj = {
        id: form.value.id,
        title: form.value.name,
        readme: form.value.description,
        comments: form.value.displayStyle,
        status: form.value.status,
      };

      if (isEdit.value) {
        await updateStatisticRuleApi(payload);
        ElMessage.success('修改成功');
      } else {
        await addStatisticRuleApi(payload);
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
      const data = modalApi.getData<CaseStatisticsRuleApi.TbCaseSettingTj>();
      modalApi.setState({
        title: data ? '编辑统计形式' : '新建统计形式',
      });

      if (data) {
        form.value = {
          id: data.id,
          name: data.title || '',
          description: data.readme || '',
          displayStyle: data.comments || '',
          status: data.status || 1,
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
    name: '',
    description: '',
    displayStyle: '',
    status: 1,
  };
}
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm ref="formRef" :model="form" label-width="140px">
        <ElFormItem
          label="统计形式名称"
          prop="name"
          :rules="[
            { required: true, message: '请输入统计形式名称', trigger: 'blur' },
          ]"
        >
          <ElInput
            v-model="form.name"
            placeholder="请输入统计形式名称"
            maxlength="50"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="统计规则说明" prop="description">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入统计规则说明"
            maxlength="500"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="预期展示样式" prop="displayStyle">
          <ElInput
            v-model="form.displayStyle"
            placeholder="请输入预期展示样式"
            maxlength="100"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
