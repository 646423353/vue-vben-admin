<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { AuthApi } from '#/api/core/auth';
import type { CustomerApi } from '#/api/core/customer';

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

import { getRoles } from '#/api/core/auth';
import { UserAddApi, UserGetApi, UserUpdateApi } from '#/api/core/authuser';
import { CustomerListApi } from '#/api/core/customer';

const emit = defineEmits(['reloadList']);

interface UserForm {
  username: string;
  description: string;
  phone: string;
  password?: string;
  roleId: number | string;
  state: number;
  customerIds: number[];
}

const userFormRef = ref<FormInstance>();
const userForm = reactive<UserForm>({
  username: '',
  description: '',
  phone: '',
  password: '',
  roleId: '',
  state: 1,
  customerIds: [],
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
const roleList = ref<AuthApi.Role[]>();
const loading = ref<boolean>(false);

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

const customerList = ref<any>(null);
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
  async onOpenChange(isOpen: boolean) {
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
      loading.value = true;
      customerList.value = await getCustomerList();
      roleList.value = await getRoleList();
      if (uid) {
        rules.password = [];
        modalApi.setState({ title: '编辑账户' });
        getUserDetail(uid);
        const customerIds = await getCustomerList(uid);
        userForm.customerIds = customerIds.map((item) => item.id);
        userFormRef.value?.clearValidate();
      }
      loading.value = false;
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
      await UserAddApi(userForm);
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
      if (!userForm.password) delete userForm.password;
      await UserUpdateApi({
        ...userForm,
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
            <ElOption
              v-for="item in roleList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="客户权限" prop="customerIds">
          <ElSelect
            v-model="userForm.customerIds"
            multiple
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
        <ElFormItem label="状态" prop="delivery">
          <ElRadioGroup v-model="userForm.state">
            <ElRadioButton :value="1" label="启用" />
            <ElRadioButton :value="2" label="禁用" />
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
