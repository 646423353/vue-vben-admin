<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CustomerApi } from '#/api/core/customer';

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

import { AreaAddApi, AreaGetApi, AreaUpdateApi } from '#/api/core/area';
import { CityAddApi, CityGetApi, CityUpdateApi } from '#/api/core/city';
import { CustomerListApi } from '#/api/core/customer';

const emit = defineEmits(['reloadList']);

interface OrganizationForm {
  type: string;
  name: string;
  owner: string;
  phone: string;
  customerId: number | string;
}

const organizationFormRef = ref<FormInstance>();
const organizationForm = reactive<OrganizationForm>({
  type: '1',
  name: '',
  owner: '',
  phone: '',
  customerId: '',
});

const rules = reactive<FormRules<OrganizationForm>>({
  type: [
    {
      required: true,
      message: '请选择类型',
      trigger: 'change',
    },
  ],
  customerId: [
    {
      required: true,
      message: '请选择所属上级组织',
      trigger: 'change',
    },
  ],
  name: [
    {
      required: true,
      message: '请输入名称',
      trigger: 'blur',
    },
  ],
  // owner: [
  //   {
  //     required: true,
  //     message: '请输入负责人',
  //     trigger: 'blur',
  //   },
  // ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: 'blur',
    },
  ],
});

const id = ref<string>('');
const loading = ref<boolean>(false);
const typeDisabled = ref<boolean>(false);

const getAreaDetail = async (id: number | string) => {
  const { name, owner, phone, customerId } = await AreaGetApi(id);

  organizationForm.name = name;
  organizationForm.owner = owner;
  organizationForm.phone = phone;
  organizationForm.customerId = Number(customerId);
};

const getCityDetail = async (id: number | string) => {
  const { name, owner, phone, customerId } = await CityGetApi(id);

  organizationForm.name = name;
  organizationForm.owner = owner;
  organizationForm.phone = phone;
  organizationForm.customerId = Number(customerId);
};

const customerList = ref<any>(null);
const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(organizationFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    if (id.value) {
      updateForm(organizationFormRef.value);
    } else {
      submitForm(organizationFormRef.value);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid, type } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      loading.value = true;

      if (uid) {
        modalApi.setState({ title: '编辑组织' });
        type === 1 ? getAreaDetail(uid) : getCityDetail(uid);
        organizationForm.type = type.toString();
        typeDisabled.value = true;
        organizationFormRef.value?.clearValidate();
      }
      customerList.value = await getCustomerList();
      loading.value = false;
    }
  },
  title: '新建组织',
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
      organizationForm.type === '1'
        ? await AreaAddApi(organizationForm)
        : await CityAddApi(organizationForm);
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
      organizationForm.type === '1'
        ? await AreaUpdateApi({
            ...organizationForm,
            id: Number(id.value),
          })
        : await CityUpdateApi({
            ...organizationForm,
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
    },
  );
  return list;
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0" v-loading="loading">
      <ElForm
        ref="organizationFormRef"
        :model="organizationForm"
        :rules="rules"
        class="demo-organizationForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="类型" prop="type">
          <ElSelect
            v-model="organizationForm.type"
            placeholder="请选择"
            :disabled="typeDisabled"
            @change="organizationForm.customerId = ''"
          >
            <ElOption label="大区" value="1" />
            <ElOption label="城市" value="3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          label="所属上级组织"
          prop="customerId"
          v-if="organizationForm.type === '3'"
        >
          <ElSelect
            v-model="organizationForm.customerId"
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
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="organizationForm.name" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="负责人" prop="owner">
          <ElInput v-model="organizationForm.owner" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput
            v-model="organizationForm.phone"
            placeholder="请输入"
            type="number"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
