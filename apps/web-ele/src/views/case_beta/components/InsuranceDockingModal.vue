<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { TbCaseCommentDto } from '#/api/core/case-comment';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import {
  addCaseCommentApi,
  updateCaseCommentApi,
} from '#/api/core/case-comment';
import { PolicyListByCardApi } from '#/api/core/policy';

const emit = defineEmits(['reloadList']);

interface InsuranceDockingForm {
  policyNo: string;
  companyName: string;
  adjusterName: string;
  adjusterPhone: string;
  adjusterEmail: string;
  dockingType: string;
}

const formRef = ref<FormInstance>();
const form = reactive<InsuranceDockingForm>({
  policyNo: '',
  companyName: '',
  adjusterName: '',
  adjusterPhone: '',
  adjusterEmail: '',
  dockingType: '',
});

const rules = reactive<FormRules<InsuranceDockingForm>>({
  policyNo: [
    {
      required: true,
      message: '请选择或输入保单号',
      trigger: ['change', 'blur'],
    },
  ],
  companyName: [
    {
      required: true,
      message: '请输入对接保险公司名称',
      trigger: 'blur',
    },
  ],
  adjusterName: [
    {
      required: true,
      message: '请输入对接理赔员姓名',
      trigger: 'blur',
    },
  ],
  adjusterPhone: [
    {
      required: true,
      message: '请输入对接理赔员电话',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码格式',
      trigger: 'blur',
    },
  ],
  adjusterEmail: [
    {
      required: true,
      message: '请输入对接理赔员邮箱',
      trigger: 'blur',
    },
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: 'blur',
    },
  ],
  dockingType: [
    {
      required: true,
      message: '请选择主险或附加险对接',
      trigger: 'change',
    },
  ],
});

const caseId = ref<number | string>('');
const editId = ref<number | undefined>();
const loading = ref<boolean>(false);

const policyOptions = ref<any[]>([]);

const fetchPolicies = async (card: string, time: string) => {
  if (!card) return;
  try {
    const tm = time ? String(moment(time).valueOf()) : '';
    const res = await PolicyListByCardApi({
      card,
      tm,
      page: 1,
      size: 50,
    });
    if (res.list && res.list.length > 0) {
      policyOptions.value = res.list
        .filter((item: any) => item.policyNo)
        .map((item: any) => ({
          label: item.policyNo,
          value: item.policyNo,
        }));
      ElMessage.success(`查询到 ${res.list.length} 条保单，请选择`);
    } else {
      policyOptions.value = [];
      ElMessage.warning('未查询到相关保单');
    }
  } catch (error) {
    console.error(error);
  }
};

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

      // eslint-disable-next-line no-console
      console.log('[InsuranceDockingModal] getData:', data);

      if (data.creditcard) {
        fetchPolicies(data.creditcard, data.insureTime);
      }

      // 判断是编辑还是添加
      const isEdit = !!data.record;

      modalApi.setState({
        title: isEdit ? '修改保司对接信息' : '创建保司对接表',
      });

      // 回显数据
      if (isEdit && data.record) {
        editId.value = data.record.id;

        // eslint-disable-next-line no-console
        console.log('[InsuranceDockingModal] Edit mode, record:', data.record);

        form.policyNo = data.record.policyNo || '';
        form.companyName = data.record.company || '';
        form.adjusterName = data.record.lipei || '';
        form.adjusterPhone = data.record.phone || '';
        form.adjusterEmail = data.record.email || '';
        form.dockingType = data.record.type || '';

        // eslint-disable-next-line no-console
        console.log('[InsuranceDockingModal] Form after assignment:', {
          ...form,
        });
      } else {
        editId.value = undefined;
      }
    }
  },
  title: '创建保司对接表',
  class: 'w-[600px]',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const params: TbCaseCommentDto = {
          caseId: caseId.value,
          policyNo: form.policyNo,
          company: form.companyName,
          lipei: form.adjusterName,
          phone: form.adjusterPhone,
          email: form.adjusterEmail,
          type: form.dockingType,
        };

        // 如果是编辑模式，添加 id 并调用更新接口
        if (editId.value) {
          params.id = editId.value;
          await updateCaseCommentApi(params);
          ElMessage.success('修改成功');
        } else {
          await addCaseCommentApi(params);
          ElMessage.success('提交成功');
        }
        emit('reloadList');
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

const dockingTypeOptions = [
  { label: '主险', value: '1' },
  { label: '附加险', value: '2' },
];
</script>

<template>
  <Modal>
    <div class="p-6" v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="170px">
        <ElFormItem label="保单号：" prop="policyNo">
          <ElSelect
            v-model="form.policyNo"
            placeholder="请选择或输入保单号"
            allow-create
            filterable
            default-first-option
          >
            <ElOption
              v-for="option in policyOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="对接保险公司名称：" prop="companyName">
          <ElInput
            v-model="form.companyName"
            placeholder="请输入对接保险公司名称"
          />
        </ElFormItem>

        <ElFormItem label="对接理赔员姓名：" prop="adjusterName">
          <ElInput
            v-model="form.adjusterName"
            placeholder="请输入对接理赔员姓名"
          />
        </ElFormItem>

        <ElFormItem label="对接理赔员电话：" prop="adjusterPhone">
          <ElInput
            v-model="form.adjusterPhone"
            placeholder="请输入对接理赔员电话"
          />
        </ElFormItem>

        <ElFormItem label="对接理赔员邮箱：" prop="adjusterEmail">
          <ElInput
            v-model="form.adjusterEmail"
            placeholder="请输入对接理赔员邮箱"
          />
        </ElFormItem>

        <ElFormItem label="主险或附加险对接：" prop="dockingType">
          <ElSelect
            v-model="form.dockingType"
            placeholder="请选择主险或附加险对接"
          >
            <ElOption
              v-for="option in dockingTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
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
