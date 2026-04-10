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
  ElSelect,
} from 'element-plus';

import { CustomerListApi } from '#/api/core/customer';
import { TagAddApi, TagUpdateApi } from '#/api/core/tags';

const emit = defineEmits(['reloadList']);

interface TagForm {
  name: string;
  customer: string;
}

const tagFormRef = ref<FormInstance>();
const tagForm = reactive<TagForm>({
  name: '',
  customer: '',
});

const rules = reactive<FormRules<TagForm>>({
  name: [
    {
      required: true,
      message: '请输入分组名称',
      trigger: 'blur',
    },
  ],
});

const id = ref<string>('');
const loading = ref<boolean>(false);
const customerOptions = ref<{ label: string; value: number }[]>([]);
const selectedCustomers = ref<number[]>([]);

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(tagFormRef.value);
    id.value = '';
    selectedCustomers.value = [];
    modalApi.close();
  },
  onConfirm() {
    if (id.value) {
      updateForm(tagFormRef.value);
    } else {
      submitForm(tagFormRef.value);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      const { id: uid, name } = data;
      id.value = uid;

      loading.value = true;
      await loadCustomerOptions();
      if (uid) {
        modalApi.setState({ title: '编辑分组' });
        tagForm.name = name || '';
        try {
          const res = await CustomerListApi(
            { tags: String(uid) },
            { page: 1, size: 1000, withTag: 1, withStop: 0, withInsure: 0 },
          );
          selectedCustomers.value = (res.list || []).map(
            (item: any) => item.id,
          );
        } catch {
          selectedCustomers.value = [];
        }
        tagFormRef.value?.clearValidate();
      } else {
        modalApi.setState({ title: '新建分组' });
        tagForm.name = '';
        selectedCustomers.value = [];
      }
      loading.value = false;
    }
  },
  title: '新建分组',
});

const back = () => {
  modalApi.close();
};

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  selectedCustomers.value = [];
}

async function loadCustomerOptions() {
  try {
    const res = await CustomerListApi(
      {},
      { page: 1, size: 1000, withTag: 1, withStop: 0, withInsure: 0 },
    );
    if (res && res.list) {
      customerOptions.value = res.list.map((item: any) => ({
        label: item.username,
        value: item.id,
      }));
    }
  } catch {}
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      const customerStr =
        selectedCustomers.value.length > 0
          ? selectedCustomers.value.join(',')
          : '';
      await TagAddApi({
        name: tagForm.name,
        customer: customerStr,
      });
      ElMessage.success('创建成功');
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    }
  });
}

async function updateForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      const customerStr =
        selectedCustomers.value.length > 0
          ? selectedCustomers.value.join(',')
          : '';
      await TagUpdateApi({
        name: tagForm.name,
        customer: customerStr,
        id: Number(id.value),
      });
      ElMessage.success('更新成功');
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    }
  });
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0" v-loading="loading">
      <ElForm
        ref="tagFormRef"
        :model="tagForm"
        :rules="rules"
        class="demo-tagForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="分组名称" prop="name">
          <ElInput v-model="tagForm.name" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem>
          <template #label>
            <div>
              <div>绑定客户</div>
              <div
                v-if="selectedCustomers.length > 0"
                class="mt-1 text-sm text-blue-600"
              >
                已选{{ selectedCustomers.length }}个客户
              </div>
            </div>
          </template>
          <ElSelect
            v-model="selectedCustomers"
            multiple
            filterable
            clearable
            placeholder="请选择客户"
            style="width: 100%"
          >
            <ElOption
              v-for="item in customerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
