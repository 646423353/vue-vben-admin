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
  ElTag,
} from 'element-plus';

import { CustomerListApi } from '#/api/core/customer';
import {
  PhoneAddApi,
  PhoneCustomerApi,
  PhoneUpdateApi,
} from '#/api/core/phone';
import { TagListApi } from '#/api/core/tags';

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
/** 分组列表 */
const tagList = ref<Array<{ customerIds: number[]; id: number; name: string }>>(
  [],
);
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
      // 加载分组列表
      await loadTagList();
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

/** 加载分组列表（只需 id + name，客户点击时实时拉取） */
async function loadTagList() {
  const { list } = await TagListApi({ page: 1, size: 1000 });
  tagList.value = list.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    customerIds: [] as number[],
  }));
}

/** 点击分组标签：实时获取该分组下客户，合并去重到已选列表 */
async function addByTag(tag: {
  customerIds: number[];
  id: number;
  name: string;
}) {
  try {
    const res = await CustomerListApi(
      { tags: String(tag.id) },
      { page: 1, size: 1000, withTag: 1, withStop: 0, withInsure: 0 },
    );
    const fetchedIds: number[] = (res.list ?? []).map((c: any) => Number(c.id));
    if (fetchedIds.length === 0) {
      ElMessage.warning(`分组「${tag.name}」下暂无客户`);
      return;
    }
    const current = new Set(phoneForm.customerArray);
    fetchedIds.forEach((id) => current.add(id));
    phoneForm.customerArray = [...current];
    ElMessage.success(
      `已添加「${tag.name}」分组共 ${fetchedIds.length} 个客户`,
    );
  } catch {
    ElMessage.error('获取分组客户失败');
  }
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
        <ElFormItem prop="customerArray">
          <template #label>
            <div>
              <div>客户</div>
              <div
                v-if="
                  phoneForm.customerArray && phoneForm.customerArray.length > 0
                "
                class="mt-1 text-sm text-blue-600"
              >
                已选{{ phoneForm.customerArray.length }}个客户
              </div>
            </div>
          </template>
          <ElSelect
            v-model="phoneForm.customerArray"
            multiple
            filterable
            clearable
            placeholder="请选择"
          >
            <ElOption
              v-for="item in customerList"
              :key="item.id"
              :label="item.username"
              :value="item.id"
            />
          </ElSelect>
          <!-- 分组快捷选择区域 -->
          <div
            v-if="tagList.length > 0"
            class="mt-1 flex flex-wrap items-center gap-1"
          >
            <span class="whitespace-nowrap text-xs text-gray-400"
              >快速添加分组下的客户</span
            >
            <ElTag
              v-for="tag in tagList"
              :key="tag.id"
              class="cursor-pointer"
              type="primary"
              size="small"
              @click="addByTag(tag)"
            >
              {{ tag.name }}
            </ElTag>
          </div>
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
