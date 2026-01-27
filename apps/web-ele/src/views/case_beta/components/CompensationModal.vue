<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { addCaseFinalApi } from '#/api/core/case-final';

const emit = defineEmits(['reloadList']);

interface CompensationForm {
  zt: string; // 主体id
  ztName: string; // 主体名称
  ztPhone: string; // 主体手机号
  ztUsername: string; // 姓名
  moneyMain: string; // 主险赔付金额
  card: string; // 银行卡号
  bank: string; // 备注（机构名）
  beginTime: string; // 付款开始时间
  endTime: string; // 赔付到账time
}

const formRef = ref<FormInstance>();
const form = reactive<CompensationForm>({
  zt: '',
  ztName: '',
  ztPhone: '',
  ztUsername: '',
  moneyMain: '',
  card: '',
  bank: '',
  beginTime: '',
  endTime: '',
});

const rules = reactive<FormRules<CompensationForm>>({
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

      // 处理subjects数据
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

      modalApi.setState({ title: '添加最终赔付表' });
    }
  },
  title: '添加最终赔付表',
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  form.zt = '';
  form.ztName = '';
  form.ztPhone = '';
  form.ztUsername = '';
}

// 监听zt变化，自动填充相关字段
watch(
  () => form.zt,
  (newVal) => {
    const selected = subjectOptions.value.find((item) => item.value === newVal);
    if (selected) {
      form.ztName = selected.zt || '';
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
        const payload: any = {
          caseId: caseId.value,
          zt: form.zt,
          ztName: form.ztName,
          ztPhone: form.ztPhone,
          ztUsername: form.ztUsername,
          moneyMain: form.moneyMain ? Number(form.moneyMain) : undefined,
          card: form.card,
          bank: form.bank,
        };

        // 转换时间为时间戳
        if (form.beginTime) {
          payload.beginTime = String(new Date(form.beginTime).getTime());
        }
        if (form.endTime) {
          payload.endTime = String(new Date(form.endTime).getTime());
        }

        await addCaseFinalApi(payload);

        ElMessage.success('提交成功');
        emit('reloadList');
        resetForm(formEl);
        modalApi.close();
      } catch (error) {
        console.error('Submit error:', error);
        ElMessage.error('提交失败');
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
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="170px">
        <ElFormItem label="赔付主体：" prop="zt">
          <ElSelect v-model="form.zt" placeholder="请选择赔付主体">
            <ElOption
              v-for="option in subjectOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="最终赔付金额：" prop="moneyMain">
          <ElInput
            v-model="form.moneyMain"
            placeholder="请输入最终赔付金额"
            type="number"
          />
        </ElFormItem>

        <ElFormItem label="收款银行卡户名：" prop="ztUsername">
          <ElInput
            v-model="form.ztUsername"
            placeholder="必须和赔付主体名称一致"
          />
        </ElFormItem>

        <ElFormItem label="收款银行卡卡号：" prop="card">
          <ElInput v-model="form.card" placeholder="请输入收款银行卡卡号" />
        </ElFormItem>

        <ElFormItem label="收款银行卡机构名：" prop="bank">
          <ElInput v-model="form.bank" placeholder="请输入收款银行卡机构名" />
        </ElFormItem>

        <ElFormItem label="付款开始时间：" prop="beginTime">
          <ElDatePicker
            v-model="form.beginTime"
            type="datetime"
            placeholder="请选择付款开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="!w-full"
          />
        </ElFormItem>

        <ElFormItem label="赔付到账时间：" prop="endTime">
          <ElDatePicker
            v-model="form.endTime"
            type="datetime"
            placeholder="请选择赔付到账时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="!w-full"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: bold;
}
</style>
