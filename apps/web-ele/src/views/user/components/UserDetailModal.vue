<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { UserGetApi } from '#/api/core/authuser';

enum Role {
  // eslint-disable-next-line no-unused-vars
  Admin = 13, // 管理员
  // eslint-disable-next-line no-unused-vars
  BusinessCustomer = 16, // 业务客户
  // eslint-disable-next-line no-unused-vars
  BusinessOperator = 15, // 业务操作员
  // eslint-disable-next-line no-unused-vars
  BusinessSupervisor = 14, // 业务主管
}

interface UserForm {
  username: string;
  description: string;
  phone: string;
  password: string;
  roleId: Role | string;
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

const getUserDetail = async (id: number | string) => {
  const { username, description, phone, password, roleId, state } =
    await UserGetApi(id);

  userForm.username = username;
  userForm.description = description;
  userForm.phone = phone;
  userForm.password = password;
  userForm.roleId = roleId;
  userForm.state = state;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(userFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        getUserDetail(uid);
      }
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
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
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
            <ElOption :value="Role.Admin" label="管理员" />
            <ElOption :value="Role.BusinessSupervisor" label="业务主管" />
            <ElOption :value="Role.BusinessOperator" label="业务操作员" />
            <ElOption :value="Role.BusinessCustomer" label="业务客户" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态" prop="delivery">
          <ElTag v-if="userForm.state === 1" effect="dark" type="success">
            启用
          </ElTag>
          <ElTag v-else-if="userForm.state === 2" effect="dark" type="warning">
            暂停
          </ElTag>
          <ElTag v-else effect="dark" type="danger">禁用</ElTag>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
