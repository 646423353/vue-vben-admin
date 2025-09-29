<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CustomerApi } from '#/api/core/customer';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { CustomerListApi } from '#/api/core/customer';
import {
  PhoneAddApi,
  PhoneCustomerApi,
  PhoneUpdateApi,
} from '#/api/core/phone';

const emit = defineEmits(['reloadList']);

interface PhoneForm {
  type: 0 | 1 | '0' | '1' | '';
  phone: string;
  customerArray?: number[];
  customerIds: string;
}

const phoneFormRef = ref<FormInstance>();
const phoneForm = reactive<PhoneForm>({
  type: '',
  phone: '',
  customerArray: [],
  customerIds: '',
});

const rules = reactive<FormRules<PhoneForm>>({
  type: [
    {
      required: true,
      message: '请选择自动投保类型',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      required: true,
      message: '请输入手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: 'blur',
    },
  ],
  customerArray: [
    {
      required: true,
      message: '请选择客户',
      trigger: 'change',
    },
  ],
});

const id = ref<string>('');
const loading = ref<boolean>(false);

const getPhoneCustomer = async (id: number | string) => {
  const { list } = await PhoneCustomerApi({ id, page: 1, size: 1000 });
  phoneForm.customerArray = list.map((item) => Number(item.customer));
};

const customerList = ref<any>(null);
const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(phoneFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    if (id.value) {
      updateForm(phoneFormRef.value);
    } else {
      submitForm(phoneFormRef.value);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid, phone } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      phoneForm.phone = phone;
      loading.value = true;
      customerList.value = await getCustomerList();
      if (uid) {
        modalApi.setState({ title: '编辑投保手机号' });
        await getPhoneCustomer(uid);
        phoneFormRef.value?.clearValidate();
      }
      loading.value = false;
    }
  },
  title: '新建投保手机号',
});

const back = () => {
  modalApi.close();
};

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      phoneForm.customerIds = JSON.stringify(phoneForm.customerArray);
      const params = cloneDeep(phoneForm);
      delete params.customerArray;
      await PhoneAddApi(params);
      ElMessage.success('创建成功');
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    } else {
      console.error('error submit!', fields);
    }
  });
}

async function updateForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      phoneForm.customerIds = JSON.stringify(phoneForm.customerArray);
      await PhoneUpdateApi({
        ...phoneForm,
        id: Number(id.value),
      });
      ElMessage.success('更新成功');
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    } else {
      console.error('error submit!', fields);
    }
  });
}

async function getCustomerList(
  uid?: string,
): Promise<CustomerApi.CustomerDetail[]> {
  const { list } = await CustomerListApi(
    {
      uid,
    },
    {
      page: 1,
      size: 2000,
      withTag: 0,
      withStop: 0,
      withInsure: 0,
    },
  );
  return list;
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0" v-loading="loading">
      <ElForm
        ref="phoneFormRef"
        :model="phoneForm"
        :rules="rules"
        class="demo-phoneForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="手机号" prop="phone">
          <ElInput
            v-model="phoneForm.phone"
            placeholder="请输入"
            type="number"
            :disabled="!!id"
          />
        </ElFormItem>
        <ElFormItem label="类型" prop="type" v-if="!id">
          <ElSelect v-model="phoneForm.type" placeholder="请选择">
            <ElOption label="河南平安" value="0" />
            <ElOption label="辽宁平安" value="1" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="客户" prop="customerArray">
          <ElSelect
            v-model="phoneForm.customerArray"
            multiple
            filterable
            placeholder="请选择"
          >
            <ElOption
              v-for="item in customerList"
              :key="item.id"
              :label="item.username"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
