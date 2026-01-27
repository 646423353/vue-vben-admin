<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { authUserListApi } from '#/api/core/authuser';
import { updateLipeiApi } from '#/api/core/case-record';

defineOptions({ name: 'TransferHandlerModal' });

const emit = defineEmits(['success', 'register']);

const formRef = ref();
const loading = ref(false);
const userList = ref<{ label: string; phone?: string; value: string }[]>([]);
const formModel = ref({
  caseId: '',
  newOwnerId: '',
  newOwnerName: '',
  command: '',
});

const rules = {
  newOwnerId: [{ required: true, message: '请选择理赔员', trigger: 'change' }],
  command: [{ required: true, message: '请输入备注', trigger: 'blur' }],
};

const [Modal, modalApi] = useVbenModal({
  title: '转派处理人',
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const { id } = modalApi.getData<Record<string, any>>();
      formModel.value.caseId = String(id);
      formModel.value.newOwnerId = '';
      formModel.value.newOwnerName = '';
      formModel.value.command = '';
      await fetchUserList();
    }
  },
});

async function fetchUserList() {
  try {
    const res = await authUserListApi({
      page: 1,
      size: 1000,
      organid: 0,
      roleId: '1,13,19,20,21,22' as any,
    });
    // Assuming res.list contains the users
    userList.value = (res.list || []).map((item: any) => ({
      label: `${item.description || item.nickName || item.username || '未知'} - ${item.username}`,
      value: String(item.userId || item.id),
      realName: item.nickName || item.username,
      phone: item.phone,
    }));
  } catch (error) {
    console.error(error);
  }
}

function handleUserChange(val: string) {
  const user = userList.value.find((item) => item.value === val);
  if (user) {
    formModel.value.newOwnerName = user.label; // or user.realName
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;
    modalApi.setState({ loading: true, confirmLoading: true });

    const selectedUser = userList.value.find(
      (u) => u.value === formModel.value.newOwnerId,
    );

    await updateLipeiApi({
      caseId: formModel.value.caseId,
      ownerId: formModel.value.newOwnerId,
      command: formModel.value.command,
      phoneOwner: selectedUser?.phone || '',
    });

    ElMessage.success('转派成功');
    emit('success');
    modalApi.close();
  } catch (error) {
    console.error(error);
    ElMessage.error('转派失败');
  } finally {
    loading.value = false;
    modalApi.setState({ loading: false, confirmLoading: false });
  }
}
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-width="100px"
      >
        <ElFormItem label="选择理赔员" prop="newOwnerId">
          <ElSelect
            v-model="formModel.newOwnerId"
            placeholder="请选择理赔员"
            filterable
            class="w-full"
            @change="handleUserChange"
          >
            <ElOption
              v-for="item in userList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注" prop="command">
          <ElInput
            v-model="formModel.command"
            type="textarea"
            placeholder="请输入备注"
            :rows="3"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
