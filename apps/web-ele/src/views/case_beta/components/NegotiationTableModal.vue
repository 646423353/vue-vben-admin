<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { TbCasePeifu } from '#/api/core/case-peifu';

import { reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { addCasePeifuApi, updateCasePeifuApi } from '#/api/core/case-peifu';

const emit = defineEmits(['success']);

interface NegotiationTableForm {
  zt: string;
  ztName: string;
  ztPhone: string;
  ztUsername: string;
}

const formRef = ref<FormInstance>();
const form = reactive<NegotiationTableForm>({
  zt: '',
  ztName: '',
  ztPhone: '',
  ztUsername: '',
});

const rules = reactive<FormRules<NegotiationTableForm>>({
  zt: [
    {
      required: true,
      message: '请选择赔付主体',
      trigger: 'change',
    },
  ],
});

const caseId = ref<number | string>('');
const loading = ref<boolean>(false);
const subjectOptions = ref<any[]>([]);
const isEdit = ref(false);
const recordId = ref<number | string>('');

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(formRef.value);
    modalApi.close();
  },
  onConfirm() {
    submitForm(formRef.value);
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      caseId.value = data.caseId;

      if (data.subjects && Array.isArray(data.subjects)) {
        let szIndex = 0;
        subjectOptions.value = data.subjects.map((item: any) => {
          let label = item.zt || '未知主体';
          if (item.zt === '三者') {
            szIndex++;
            label = `三者${szIndex}`;
          }
          return {
            label,
            value: String(item.id),
            username: item.username || '',
            phone: item.phone || '',
            zt: item.zt,
          };
        });
      }

      if (data.record) {
        isEdit.value = true;
        recordId.value = data.record.id;
        // Pre-fill form
        form.zt = String(data.record.zt);
        modalApi.setState({ title: '编辑赔付协商表' });

        // Use setTimeout to ensure we overwrite any auto-filled values from the watcher
        setTimeout(() => {
          form.ztName = data.record.ztName;
          form.ztPhone = data.record.ztPhone;
          form.ztUsername = data.record.ztUsername;
        }, 0);
      } else {
        isEdit.value = false;
        recordId.value = '';
        modalApi.setState({ title: '添加赔付协商表' });
      }
    }
  },
  title: '添加赔付协商表',
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  form.zt = '';
  form.ztName = '';
  form.ztPhone = '';
  form.ztUsername = '';
  isEdit.value = false;
  recordId.value = '';
}

// Watch subject selection to auto-fill fields
watch(
  () => form.zt,
  (newVal) => {
    // Only auto-fill if NOT in edit mode initial load?
    // But user might change subject IN edit mode.
    // If user changes subject, we SHOULD auto-fill.
    // The issue is on initial load, setting form.zt triggers this.
    // That's why we use setTimeout in onOpenChange to overwrite.
    const selected = subjectOptions.value.find((item) => item.value === newVal);
    if (selected) {
      form.ztName = selected.zt === '三者' ? '三者' : selected.label || '';
      form.ztPhone = selected.phone || '';
      form.ztUsername = selected.username || '';
    }
  },
);

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const payload: TbCasePeifu = {
          caseId: caseId.value,
          zt: form.zt,
          ztName: form.ztName,
          ztPhone: form.ztPhone,
          ztUsername: form.ztUsername,
        };

        if (isEdit.value && recordId.value) {
          payload.id = recordId.value;
          await updateCasePeifuApi(payload);
          ElMessage.success('更新成功');
        } else {
          await addCasePeifuApi(payload);
          ElMessage.success('提交成功');
        }

        emit('success');
        resetForm(formEl);
        modalApi.close();
      } catch (error) {
        console.error('Submit error:', error);
      } finally {
        loading.value = false;
      }
    }
  });
}
</script>

<template>
  <Modal>
    <div class="p-6" v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
        <ElFormItem label="赔付主体：" prop="zt">
          <ElSelect v-model="form.zt" placeholder="请选择赔付主体">
            <ElOption
              v-for="item in subjectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem v-show="false" label="主体名称：" prop="ztName">
          <ElInput v-model="form.ztName" placeholder="请输入主体名称" />
        </ElFormItem>

        <!-- Moved and Renamed -->
        <ElFormItem label="主体姓名：" prop="ztUsername">
          <ElInput v-model="form.ztUsername" placeholder="请输入主体姓名" />
        </ElFormItem>

        <ElFormItem label="主体手机号：" prop="ztPhone">
          <ElInput v-model="form.ztPhone" placeholder="请输入主体手机号" />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
