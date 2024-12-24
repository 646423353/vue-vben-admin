<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { type AuthApi, getRoles } from '#/api/core/auth';
import { UserGetApi } from '#/api/core/authuser';
import { type CustomerApi, CustomerListApi } from '#/api/core/customer';

interface UserForm {
  username: string;
  description: string;
  phone: string;
  password: string;
  roleId: number | string;
  state: number;
}

const userFormRef = ref<FormInstance>();
const userForm = reactive<UserForm>({
  username: '',
  description: '',
  phone: '',
  password: '',
  roleId: '',
  state: 1,
});

const id = ref<string>('');
const roleList = ref<AuthApi.Role[]>();
const loading = ref<boolean>(false);

const getUserDetail = async (id: number | string) => {
  const { username, description, phone, roleId, state } = await UserGetApi(id);

  userForm.username = username;
  userForm.description = description;
  userForm.phone = phone;
  userForm.roleId = roleId;
  userForm.state = state;
};

const customerList = ref<CustomerApi.CustomerDetail[]>([]);
const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(userFormRef.value);
    id.value = '';
    modalApi.close();
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      loading.value = true;
      roleList.value = await getRoleList();
      if (uid) {
        getUserDetail(uid);
        customerList.value = await getCustomerList(uid);
      }
      loading.value = false;
    }
  },
  title: '账户详情',
  showConfirmButton: false,
  cancelText: '关闭',
});

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
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

async function getRoleList() {
  const result = await getRoles();
  return result.filter((item) => item.id !== 1);
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0" v-loading="loading">
      <ElForm
        ref="userFormRef"
        :model="userForm"
        class="demo-userForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="登录名" prop="username">
          <ElInput v-model="userForm.username" readonly />
        </ElFormItem>
        <ElFormItem label="昵称" prop="description">
          <ElInput v-model="userForm.description" readonly />
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="userForm.phone" readonly type="number" />
        </ElFormItem>
        <ElFormItem label="权限" prop="roleId">
          <ElSelect v-model="userForm.roleId" disabled placeholder="请选择">
            <ElOption
              v-for="item in roleList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="客户权限" prop="customerIds">
          <span v-if="customerList.length === 0">未设置</span>
          <ElDescriptions v-else :column="1" border class="w-full" size="small">
            <ElDescriptionsItem
              v-for="item in customerList"
              :key="item.id"
              label-class-name="hidden"
            >
              {{ item.username }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </ElFormItem>
        <ElFormItem label="状态" prop="delivery">
          <ElTag v-if="userForm.state === 1" effect="dark" type="success">
            启用
          </ElTag>
          <ElTag v-else effect="dark" type="danger">禁用</ElTag>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
