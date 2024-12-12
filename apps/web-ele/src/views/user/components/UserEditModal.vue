<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { UserAddApi, UserGetApi, UserUpdateApi } from '#/api/core/authuser';

const emit = defineEmits(['reloadList']);

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

const rules = reactive<FormRules<UserForm>>({
  username: [
    {
      required: true,
      message: '请输入登录名',
      trigger: 'blur',
    },
  ],
  description: [
    {
      required: true,
      message: '请输入昵称',
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
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur',
    },
    {
      min: 6,
      message: '密码长度不能小于6位',
      trigger: 'blur',
    },
  ],
  roleId: [
    {
      required: true,
      message: '请选择账户权限',
      trigger: 'change',
    },
  ],
  state: [
    {
      required: true,
      message: '请选择账户状态',
      trigger: 'blur',
    },
  ],
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
  onConfirm() {
    if (id.value) {
      updateForm(userFormRef.value);
    } else {
      submitForm(userFormRef.value);
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      rules.password = [
        {
          required: true,
          message: '请输入密码',
          trigger: 'blur',
        },
        {
          min: 6,
          message: '密码长度不能小于6位',
          trigger: 'blur',
        },
      ];
      if (uid) {
        rules.password = [];
        modalApi.setState({ title: '编辑账户' });
        getUserDetail(uid);
      }
    }
  },
  title: '新建账户',
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
      const result = await UserAddApi(userForm);
      ElMessage.success(`${result}`);
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
      const result = await UserUpdateApi({
        ...userForm,
        id: Number(id.value),
      });
      ElMessage.success(`${result}`);
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    } else {
      console.error('error submit!', fields);
    }
  });
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="userFormRef"
        :model="userForm"
        :rules="rules"
        class="demo-userForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="登录名" prop="username">
          <ElInput v-model="userForm.username" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="昵称" prop="description">
          <ElInput v-model="userForm.description" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput
            v-model="userForm.phone"
            placeholder="请输入"
            type="number"
          />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput v-model="userForm.password" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="权限" prop="roleId">
          <ElSelect v-model="userForm.roleId" placeholder="请选择">
            <ElOption :value="Role.Admin" label="管理员" />
            <ElOption :value="Role.BusinessSupervisor" label="业务主管" />
            <ElOption :value="Role.BusinessOperator" label="业务操作员" />
            <ElOption :value="Role.BusinessCustomer" label="业务客户" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态" prop="delivery">
          <ElRadioGroup v-model="userForm.state">
            <ElRadioButton :value="1" label="启用" />
            <ElRadioButton :value="2" label="暂停" />
            <ElRadioButton :value="0" label="禁用" />
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
