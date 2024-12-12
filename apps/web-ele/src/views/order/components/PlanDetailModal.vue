<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElTag } from 'element-plus';
import moment from 'moment';

import { PlanGetApi } from '#/api/core/plan';

interface PlanForm {
  customerName?: string;
  insureSn: string;
  groupId: number | string;
  groupName: string;
  mainInsureId: string;
  mainInsureName: string;
  additionalInsureId: string;
  additionalInsureName: string;
  beginTime: string;
  endTime: string;
  status: number;
}

const planFormRef = ref<FormInstance>();
const planForm = reactive<PlanForm>({
  customerName: '',
  insureSn: '',
  groupId: '',
  groupName: '',
  mainInsureId: '',
  mainInsureName: '',
  additionalInsureId: '',
  additionalInsureName: '',
  beginTime: '',
  endTime: '',
  status: 1,
});

const id = ref<string>('');

const getPlanDetail = async (id: number | string) => {
  const {
    customerName,
    insureSn,
    groupId,
    groupName,
    mainInsureId,
    mainInsureName,
    additionalInsureId,
    additionalInsureName,
    beginTime,
    endTime,
    status,
  } = await PlanGetApi(id);

  planForm.customerName = customerName;
  planForm.insureSn = insureSn;
  planForm.groupId = groupId;
  planForm.groupName = groupName;
  planForm.mainInsureId = mainInsureId;
  planForm.mainInsureName = mainInsureName;
  planForm.additionalInsureId = additionalInsureId;
  planForm.additionalInsureName = additionalInsureName;
  planForm.beginTime = beginTime;
  planForm.endTime = endTime;
  planForm.status = status;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(planFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getPlanDetail(uid);
      }
    }
  },
  title: '站点详情',
  showConfirmButton: false,
  cancelText: '关闭',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="planFormRef"
        :model="planForm"
        class="demo-planForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="客户名称">
          <ElInput v-model="planForm.customerName" readonly />
        </ElFormItem>
        <ElFormItem label="保险编码">
          <ElInput v-model="planForm.insureSn" readonly />
        </ElFormItem>
        <ElFormItem label="主险方案">
          <ElInput v-model="planForm.mainInsureName" readonly />
        </ElFormItem>
        <ElFormItem label="附加险方案">
          <ElInput v-model="planForm.additionalInsureName" readonly />
        </ElFormItem>
        <ElFormItem label="启用时间">
          <ElInput
            :value="`${moment(planForm.beginTime).format('YYYY-MM-DD')}`"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="止用时间">
          <ElInput
            :value="`${moment(planForm.endTime).format('YYYY-MM-DD')}`"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElTag v-if="planForm.status === 1" effect="dark" type="primary">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
