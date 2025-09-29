<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CustomerApi } from '#/api/core/customer';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { codeToText, regionData } from 'element-china-area-data';
import {
  ElCascader,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { CityListApi } from '#/api/core/city';
import { CustomerListApi } from '#/api/core/customer';
import { StopAddApi, StopGetApi, StopUpdateApi } from '#/api/core/stop';

interface StopForm {
  customerName?: string;
  name: string;
  owner: string;
  phone: string;
  province: string | undefined;
  city: string | undefined;
  district: string | undefined;
  addr: string;
  address: string;
  status: number;
  catecityName?: string;
  catecity: number | string;
  customerId: number | string;
  addrIds: string[];
}

const emit = defineEmits(['reloadList']);
const stopFormRef = ref<FormInstance>();
const stopForm = reactive<StopForm>({
  customerName: '',
  name: '',
  owner: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  addr: '',
  address: '',
  status: 1,
  catecityName: '',
  catecity: '',
  customerId: '',
  addrIds: [],
});

const rules = reactive<FormRules<StopForm>>({
  customerId: [
    {
      required: true,
      message: '请选择客户',
      trigger: 'change',
    },
  ],
  name: [
    {
      required: true,
      message: '请输入站点名称',
      trigger: 'blur',
    },
  ],
  owner: [
    {
      required: true,
      message: '请输入联系人',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      trigger: 'blur',
      validator: (rule: any, value: string, callback: any) => {
        if (!value) callback();
        if (!/^1[3-9]\d{9}$/.test(value)) {
          return callback(new Error('手机号格式错误'));
        }
        callback();
      },
    },
  ],
});

const id = ref<string>('');
const customerList = ref<any>(null);
const cityList = ref<any>(null);

const loading = ref<boolean>(false);
const regionOptions = ref(regionData);

const back = () => {
  modalApi.close();
};

const getStopDetail = async (id: number | string) => {
  const {
    customerName,
    customerId,
    name,
    owner,
    phone,
    province,
    city,
    district,
    addr,
    address,
    status,
    catecityName,
    catecity,
  } = await StopGetApi(id);

  stopForm.customerName = customerName;
  stopForm.customerId = Number(customerId);
  stopForm.addrIds = JSON.parse(addr || '[]');
  stopForm.name = name;
  stopForm.owner = owner;
  stopForm.phone = phone;
  stopForm.province = province;
  stopForm.city = city;
  stopForm.district = district;
  stopForm.addr = addr;
  stopForm.address = address;
  stopForm.status = status;
  stopForm.catecityName = catecityName;
  stopForm.catecity = catecity;
  getCityList(stopForm.customerId);
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(stopFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    if (id.value) {
      updateForm(stopFormRef.value);
    } else {
      submitForm(stopFormRef.value);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = modalApi.getData<Record<string, any>>();
      id.value = uid;
      loading.value = true;
      customerList.value = await getCustomerList();

      if (uid) {
        modalApi.setState({ title: '编辑站点' });
        getStopDetail(uid);
      }
      loading.value = false;
    }
  },
  title: '新建站点',
  cancelText: '关闭',
});

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

async function getCityList(customerId: number | string) {
  const { list } = await CityListApi(
    {
      customerId,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  cityList.value = list;
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      stopForm.addr = JSON.stringify(stopForm.addrIds);
      await StopAddApi(stopForm);
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
      stopForm.addr = JSON.stringify(stopForm.addrIds);
      await StopUpdateApi({
        ...stopForm,
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

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
}

const areaChange = (value: any) => {
  if (value[0] && value[1] && value[2]) {
    stopForm.province = codeToText[value[0] as string];
    stopForm.city = codeToText[value[1] as string];
    stopForm.district = codeToText[value[2] as string];
  }
};
</script>
<template>
  <Modal>
    <div class="p-4 pb-0" v-loading="loading">
      <ElForm
        ref="stopFormRef"
        :model="stopForm"
        class="demo-stopForm"
        label-width="auto"
        status-icon
        :rules="rules"
      >
        <ElFormItem label="所属客户" prop="customerId">
          <ElSelect
            v-model="stopForm.customerId"
            placeholder="请选择"
            @change="getCityList"
          >
            <ElOption
              v-for="item in customerList"
              :key="item.id"
              :label="item.username"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="所属城市">
          <ElSelect
            v-model="stopForm.catecity"
            placeholder="请选择"
            :no-data-text="
              stopForm.customerId ? '该客户还未添加城市' : '请先选择客户'
            "
          >
            <ElOption
              v-for="item in cityList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="站点名称" prop="name">
          <ElInput v-model="stopForm.name" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="所在地区">
          <ElCascader
            class="w-full"
            v-model="stopForm.addrIds"
            :options="regionOptions"
            placeholder="请选择"
            @change="areaChange"
          />
        </ElFormItem>
        <ElFormItem label="详细地址">
          <ElInput v-model="stopForm.address" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="站长姓名" prop="owner">
          <ElInput v-model="stopForm.owner" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="站长电话" prop="phone">
          <ElInput v-model="stopForm.phone" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch
            v-model="stopForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="可用"
            inactive-text="不可用"
            inline-prompt
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
