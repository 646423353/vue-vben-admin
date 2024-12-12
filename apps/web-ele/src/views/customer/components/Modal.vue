<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { GroupAddApi, GroupGetApi, GroupUpdateApi } from '#/api/core/group';
import { InsureListApi } from '#/api/core/insure';

interface GroupForm {
  insureSn: string;
  groupName: string;
  mainInsureId: number | string;
  additionalInsureId: number | string;
  status: number;
}

interface RowType {
  id: number;
  ordertype: string;
}

const emit = defineEmits(['reloadList']);
const groupFormRef = ref<FormInstance>();
const groupForm = reactive<GroupForm>({
  insureSn: '',
  groupName: '',
  mainInsureId: '',
  additionalInsureId: '',
  status: 1,
});

const rules = reactive<FormRules<GroupForm>>({
  insureSn: [
    {
      required: true,
      message: '请输入保险编码',
      trigger: 'blur',
    },
  ],
  groupName: [
    {
      required: true,
      message: '请输入组合名称',
      trigger: 'blur',
    },
  ],
  mainInsureId: [
    {
      required: true,
      message: '请选择主险方案',
      trigger: 'change',
    },
  ],
  additionalInsureId: [
    {
      required: true,
      message: '请选择附加险方案',
      trigger: 'change',
    },
  ],
  status: [
    {
      required: true,
      message: '请选择方案状态',
      trigger: 'blur',
    },
  ],
});

const id = ref<string>('');

const getGroupDetail = async (id: number | string) => {
  const { insureSn, groupName, mainInsureId, additionalInsureId, status } =
    await GroupGetApi(id);

  groupForm.insureSn = insureSn;
  groupForm.groupName = groupName;
  groupForm.mainInsureId = Number(mainInsureId);
  groupForm.additionalInsureId = Number(additionalInsureId);
  groupForm.status = status;
};

const getInsureList = async (cate: number) => {
  const { list } = await InsureListApi(
    {
      cate,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  return list;
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(groupFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    if (id.value) {
      updateForm(groupFormRef.value);
    } else {
      submitForm(groupFormRef.value);
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      if (uid) {
        modalApi.setState({ title: '编辑组合方案' });
        getGroupDetail(uid);
      }
    }
  },
  title: '新建组合方案',
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
      const result = await GroupAddApi(groupForm);
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
      const result = await GroupUpdateApi({
        ...groupForm,
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

const mainInsureList = ref<RowType[]>([]);
const additionalInsureList = ref<RowType[]>([]);

onMounted(async () => {
  mainInsureList.value = await getInsureList(1);
  additionalInsureList.value = await getInsureList(2);
});
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="groupFormRef"
        :model="groupForm"
        :rules="rules"
        class="demo-groupForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="保险编码(唯一)" prop="insureSn">
          <ElInput v-model="groupForm.insureSn" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="组合名称" prop="groupName">
          <ElInput v-model="groupForm.groupName" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="主险方案" prop="mainInsureId">
          <ElSelect v-model="groupForm.mainInsureId" placeholder="请选择">
            <ElOption
              v-for="item in mainInsureList"
              :key="item.id"
              :label="item.ordertype"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="附加险方案" prop="additionalInsureId">
          <ElSelect v-model="groupForm.additionalInsureId" placeholder="请选择">
            <ElOption
              v-for="item in additionalInsureList"
              :key="item.id"
              :label="item.ordertype"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态" prop="delivery">
          <ElSwitch
            v-model="groupForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="可用"
            inactive-text="不可用"
            inline-prompt
          />
        </ElFormItem>

        <!-- <ElFormItem style="text-align: right">
          <ElButton v-if="id" type="primary" @click="updateForm(groupFormRef)">
            更新
          </ElButton>
          <ElButton v-else type="primary" @click="submitForm(groupFormRef)">
            提交
          </ElButton>
          <ElButton @click="test">取消</ElButton>
        </ElFormItem> -->
      </ElForm>
    </div>
  </Modal>
</template>
