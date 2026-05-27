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

import {
  addCaseCommentApi,
  getCaseCommentListApi,
  updateCaseCommentApi,
} from '#/api/core/case-comment';

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
  dockingType: [
    {
      required: true,
      message: '请选择对接险种',
      trigger: 'change',
    },
  ],
  policyNo: [
    {
      required: true,
      message: '保单号不能为空，请确保该险种已有保单号',
      trigger: 'change',
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
});

const caseId = ref<number | string>('');
const editId = ref<number | undefined>();
const loading = ref<boolean>(false);

const caseDataRef = ref<any>({});
const usedTypes = ref<string[]>([]);

const dockingTypeOptions = [
  { label: '主险', value: '1' },
  { label: '附加险', value: '2' },
  { label: '新职伤', value: '3' },
];

const fetchUsedDockingTypes = async (
  id: number | string,
  currentEditType?: string,
) => {
  try {
    const res = await getCaseCommentListApi({ caseId: id, size: 50, page: 1 });
    if (res && res.list) {
      usedTypes.value = res.list
        .map((item: any) => String(item.type))
        .filter(
          (t: string) =>
            t && t !== currentEditType && t !== 'undefined' && t !== 'null',
        );
    }
  } catch (error) {
    console.error('Fetch comments failed:', error);
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
      caseDataRef.value = data.caseData || {};

      // eslint-disable-next-line no-console
      console.log('[InsuranceDockingModal] getData:', data);

      // 判断是编辑还是添加
      const isEdit = !!data.record;

      modalApi.setState({
        title: isEdit ? '修改保司对接信息' : '创建保司对接表',
      });

      // 初始化表单和已被占用的选项
      usedTypes.value = [];
      let currentType = '';

      if (isEdit && data.record) {
        editId.value = data.record.id;
        currentType = String(data.record.type);

        form.policyNo = data.record.policyNo || '';
        form.companyName = data.record.company || '';
        form.adjusterName = data.record.lipei || '';
        form.adjusterPhone = data.record.phone || '';
        form.adjusterEmail = data.record.email || '';
        form.dockingType = currentType || '';
      } else {
        editId.value = undefined;
      }

      if (caseId.value) {
        fetchUsedDockingTypes(caseId.value, currentType);
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

function handleDockingTypeChange(val: string) {
  if (!caseDataRef.value) return;
  let extPolicyNo = '';
  if (val === '1') {
    extPolicyNo = caseDataRef.value.policyNo || '';
  } else if (val === '2') {
    extPolicyNo = caseDataRef.value.policyNoAttach || '';
  } else if (val === '3') {
    extPolicyNo = caseDataRef.value.insured_xinzhishang || '';
  }

  form.policyNo = extPolicyNo;

  if (!extPolicyNo) {
    ElMessage.warning(
      '该险种尚未填写保单号，请先在案件基本信息中完善或手动确认！',
    );
  }
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
</script>

<template>
  <Modal>
    <div class="p-6" v-loading="loading">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="170px">
        <ElFormItem label="对接险种：" prop="dockingType">
          <ElSelect
            v-model="form.dockingType"
            placeholder="请选择对接险种（主险/附加险/新职伤）"
            @change="handleDockingTypeChange"
          >
            <ElOption
              v-for="option in dockingTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              :disabled="usedTypes.includes(option.value)"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="保单号：" prop="policyNo">
          <ElInput
            v-model="form.policyNo"
            placeholder="选择险种后自动提取，不可修改"
            disabled
          />
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
      </ElForm>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-form-item__label) {
  font-weight: bold;
}
</style>
