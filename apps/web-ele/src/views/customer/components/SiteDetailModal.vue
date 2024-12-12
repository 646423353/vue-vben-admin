<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElTag } from 'element-plus';

import { StopGetApi } from '#/api/core/stop';

interface StopForm {
  customerName?: string;
  name: string;
  owner: string;
  phone: string;
  province: string | undefined;
  city: string | undefined;
  district: string | undefined;
  addr: string;
  address: string;
  status: number;
}

const stopFormRef = ref<FormInstance>();
const stopForm = reactive<StopForm>({
  customerName: '',
  name: '',
  owner: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  addr: '',
  address: '',
  status: 1,
});

const id = ref<string>('');

const getStopDetail = async (id: number | string) => {
  const {
    customerName,
    name,
    owner,
    phone,
    province,
    city,
    district,
    addr,
    address,
    status,
  } = await StopGetApi(id);

  stopForm.customerName = customerName;
  stopForm.name = name;
  stopForm.owner = owner;
  stopForm.phone = phone;
  stopForm.province = province;
  stopForm.city = city;
  stopForm.district = district;
  stopForm.addr = addr;
  stopForm.address = address;
  stopForm.status = status;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(stopFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getStopDetail(uid);
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
        ref="stopFormRef"
        :model="stopForm"
        class="demo-stopForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="客户名称">
          <ElInput v-model="stopForm.customerName" readonly />
        </ElFormItem>
        <ElFormItem label="站点名称">
          <ElInput v-model="stopForm.name" readonly />
        </ElFormItem>
        <ElFormItem label="所在地区">
          <ElInput
            :value="`${stopForm.province} / ${stopForm.city} / ${stopForm.district}`"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="详细地址">
          <ElInput v-model="stopForm.address" readonly />
        </ElFormItem>
        <ElFormItem label="站长姓名">
          <ElInput v-model="stopForm.owner" readonly />
        </ElFormItem>
        <ElFormItem label="站长电话">
          <ElInput v-model="stopForm.phone" readonly />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElTag v-if="stopForm.status === 1" effect="dark" type="primary">
            可用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">不可用</ElTag>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
