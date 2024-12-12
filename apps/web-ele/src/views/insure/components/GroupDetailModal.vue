<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElTag } from 'element-plus';

import { GroupGetApi } from '#/api/core/group';

interface GroupForm {
  insureSn: string;
  groupName: string;
  mainInsureId: number | string;
  mainInsure?: string;
  additionalInsureId: number | string;
  additionalInsure?: string;
  status: number;
}

const groupFormRef = ref<FormInstance>();
const groupForm = reactive<GroupForm>({
  insureSn: '',
  groupName: '',
  mainInsureId: '',
  additionalInsureId: '',
  status: 1,
});

const id = ref<string>('');

const getGroupDetail = async (id: number | string) => {
  const {
    insureSn,
    groupName,
    mainInsureId,
    mainInsure,
    additionalInsureId,
    additionalInsure,
    status,
  } = await GroupGetApi(id);

  groupForm.insureSn = insureSn;
  groupForm.groupName = groupName;
  groupForm.mainInsureId = Number(mainInsureId);
  groupForm.mainInsure = mainInsure;
  groupForm.additionalInsureId = Number(additionalInsureId);
  groupForm.additionalInsure = additionalInsure;
  groupForm.status = status;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(groupFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getGroupDetail(uid);
      }
    }
  },
  title: '组合方案详情',
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
        ref="groupFormRef"
        :model="groupForm"
        class="demo-groupForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="保险编码(唯一)">
          <ElInput v-model="groupForm.insureSn" readonly />
        </ElFormItem>
        <ElFormItem label="组合名称">
          <ElInput v-model="groupForm.groupName" readonly />
        </ElFormItem>
        <ElFormItem label="主险方案">
          <ElInput v-model="groupForm.mainInsure" readonly />
        </ElFormItem>
        <ElFormItem label="附加险方案">
          <ElInput v-model="groupForm.additionalInsure" readonly />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElTag v-if="groupForm.status === 1" effect="dark" type="success">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
