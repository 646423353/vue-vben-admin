<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { CaseSetApi } from '#/api/core/case-set';

const emit = defineEmits(['reload']);

const formRef = ref();
const loading = ref(false);
const title = ref('新增定损项目');
const isEdit = ref(false);
const id = ref<number>();

const formData = ref({
  title: '',
  comments: '',
  type: 1, // 1: Big Class, 2: Item
  cateId: undefined as number | undefined,
});

const rules = {
  title: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  cateId: [{ required: true, message: '请选择所属大类', trigger: 'change' }],
};

const parentOptions = ref<{ label: string; value: number }[]>([]);

// Get Big Classes for Parent Selection
async function fetchParentOptions() {
  const res = await CaseSetApi.getMoneyCateList();
  parentOptions.value = res.map((item) => ({
    label: item.title || '',
    value: item.id!,
  }));
}

const [Modal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData<any>();
      isEdit.value = !!data?.isEdit;
      const row = data?.row;
      id.value = row?.id;

      // Reset form
      formData.value = {
        title: '',
        comments: '',
        type: 1,
        cateId: undefined,
      };

      await fetchParentOptions();

      // If user clicked "Add", they might have passed a type or parentId?
      // Assuming naive add.

      if (isEdit.value && row) {
        title.value = '编辑定损项目';
        // Infer type: if row has cateId, it's an Item (2), else Cate (1).
        // Or passed explicitly.
        // Index.vue was using type 1/2.
        const isItem = !!row.cateId || row.type === 2;
        formData.value = {
          title: row.title || row.name,
          comments: row.comments,
          type: isItem ? 2 : 1,
          cateId: row.cateId || row.parentId,
        };
      } else {
        title.value = '新增定损项目';
      }
    }
  },
  onConfirm: async () => {
    await formRef.value?.validate();
    loading.value = true;
    try {
      const commonPayload = {
        title: formData.value.title,
        comments: formData.value.comments,
      };

      if (isEdit.value) {
        await (formData.value.type === 1
          ? CaseSetApi.updateMoneyCate({
              ...commonPayload,
              id: id.value,
            })
          : CaseSetApi.updateMoneyItem({
              ...commonPayload,
              id: id.value,
              cateId: formData.value.cateId,
            }));
        ElMessage.success('更新成功');
      } else {
        await (formData.value.type === 1
          ? CaseSetApi.addMoneyCate(commonPayload)
          : CaseSetApi.addMoneyItem({
              ...commonPayload,
              cateId: formData.value.cateId,
            }));
        ElMessage.success('添加成功');
      }
      emit('reload');
      modalApi.close();
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal :loading="loading" :title="title">
    <div class="p-6">
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <ElFormItem label="类型" prop="type">
          <ElRadioGroup v-model="formData.type" :disabled="isEdit">
            <ElRadio :label="1" :value="1">大类</ElRadio>
            <ElRadio :label="2" :value="2">项目</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="formData.type === 2" label="所属大类" prop="cateId">
          <ElSelect
            v-model="formData.cateId"
            class="w-full"
            placeholder="请选择所属大类"
          >
            <ElOption
              v-for="opt in parentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="名称" prop="title">
          <ElInput v-model="formData.title" placeholder="请输入名称" />
        </ElFormItem>

        <ElFormItem label="备注" prop="comments">
          <ElInput
            v-model="formData.comments"
            :rows="3"
            placeholder="请输入备注"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
