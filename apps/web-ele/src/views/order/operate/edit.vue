<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { useUserIdStore } from '@vben/stores';

import { useClipboard } from '@vueuse/core';
import {
  ElButton,
  ElCard,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import { CustomerListApi } from '#/api/core/customer';
import { OrderAddApi, OrderGetApi, OrderUpdateApi } from '#/api/core/order';
import { PlanListApi } from '#/api/core/plan';
import { useOrderStore } from '#/store/order';

import Members from '../components/Members.vue';

interface MemberDto {
  bxbm: string;
  comment: string;
  comment2: string;
  creditcard: string;
  id?: number;
  operateTag?: number;
  userid: number;
  username: string;
}

interface OrderForm {
  consignTime: string;
  customer: string;
  emailAdd: string;
  emailMain: string;
  endTime: string;
  id?: number;
  locationtype: number | string;
  insureSn?: string;
  lzxtype: string;
  lzxName?: string;
  memberDtos: MemberDto[];
  orderSn: string;
  period: string;
  remark: string;
  safetype: number | string;
  safeid: number | string;
  shippingCode: string;
  shippingCodeAdd: string;
  ywxtype: string;
  ywxName?: string;
}

const orderFormRef = ref<FormInstance>();
const orderForm = reactive<OrderForm>({
  consignTime: '',
  customer: '',
  emailAdd: '',
  emailMain: '',
  endTime: '',
  locationtype: '',
  lzxtype: '',
  memberDtos: [],
  orderSn: '',
  period: '',
  remark: '',
  safetype: '',
  safeid: '',
  shippingCode: '',
  shippingCodeAdd: '',
  ywxtype: '',
});

const validateEmail = (rule: any, value: any, callback: any) => {
  if (!value) callback();
  // eslint-disable-next-line regexp/no-unused-capturing-group
  if (!/^([\w-])+@(([\w-])+\.)+[a-z]{2,4}$/i.test(value)) {
    return callback(new Error('邮箱格式错误'));
  }
  callback();
};

const rules = reactive<FormRules<OrderForm>>({
  customer: [
    {
      required: true,
      message: '请选择客户',
      trigger: 'change',
    },
  ],
  consignTime: [
    {
      required: true,
      message: '请选择起保日期',
      trigger: 'change',
    },
  ],
  endTime: [
    {
      required: true,
      message: '请选择终保日期',
      trigger: 'change',
    },
  ],
  safeid: [
    {
      required: true,
      message: '请选择保险编码',
      trigger: 'change',
    },
  ],
  lzxName: [
    {
      required: true,
      message: '请选择保险编码',
      trigger: 'blur',
    },
  ],
  ywxName: [
    {
      required: true,
      message: '请选择保险编码',
      trigger: 'blur',
    },
  ],
  emailMain: [
    {
      validator: validateEmail,
      trigger: 'blur',
    },
  ],
  emailAdd: [
    {
      validator: validateEmail,
      trigger: 'blur',
    },
  ],
});

const store = useOrderStore();
const router = useRouter();
const route = useRoute();
const useridStore = useUserIdStore();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');

const back = () => {
  closeCurrentTab();
  router.back();
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const memberRef = ref<any>(null);
const loading = ref<boolean>(false);

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      orderForm.period = new Date(orderForm.consignTime)!
        .toISOString()!
        .split('T')[0]!
        .replaceAll('-', '')!
        .slice(0, 6);

      const memberData = memberRef.value?.getData();
      const formatData = memberData.map((item: any) => {
        return {
          username: item.姓名,
          creditcard: item.身份证,
          bxbm: item.保险编码,
          comment: item.备注1,
          comment2: item.备注2,
          userid: useridStore.userId,
        };
      });

      if (formatData.length === 1 && formatData[0].username === '模板-张三') {
        ElMessage.error('请上传人员清单');
        return;
      }

      if ((await memberRef.value?.fullValidEvent()) === false) {
        ElMessage.error('请检查人员清单');
        return;
      }

      try {
        loading.value = true;
        const result = await OrderAddApi({
          ...orderForm,
          memberDtos: formatData,
        });
        ElMessage.success(`${result}`);
        store.changeOrderStatus(true);
        back();
        resetForm(formEl);
      } catch (error) {
        console.error(error);
        ElMessageBox.alert(
          '由于数据过多，导入仍在进行中，无需再次提交，请稍后在订单列表中查看。稍后如果订单列表仍未出现，请联系管理员。',
          '提示',
          {
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: '关闭',
          },
        );
      } finally {
        loading.value = false;
      }
    } else {
      console.error('error submit!', fields);
    }
  });
};

const updateForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      const result = await OrderUpdateApi({
        id: Number(id.value),
        ...orderForm,
      });
      ElMessage.success(`${result}`);
      store.changeOrderStatus(true);
      back();
      resetForm(formEl);
    } else {
      console.error('error submit!', fields);
    }
  });
};

const customerList = ref<any>(null);
const getCustomerList = async () => {
  const { list } = await CustomerListApi(
    {},
    {
      page: 1,
      size: 2000,
    },
  );
  customerList.value = list;
};

const planList = ref<any>([]);
const getGroupList = async (id: number) => {
  orderForm.safeid = '';
  orderForm.insureSn = '';
  orderForm.lzxtype = '';
  orderForm.lzxName = '';
  orderForm.ywxtype = '';
  orderForm.ywxName = '';
  const { list } = await PlanListApi(
    {
      customerId: id,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  planList.value = list;
};

const setPolicy = (id: number | string) => {
  const plan = planList.value.find((item: any) => item.id === id);
  orderForm.safetype = plan?.groupId;
  orderForm.insureSn = plan?.insureSn;
  orderForm.lzxtype = plan?.mainInsureId;
  orderForm.lzxName = plan?.mainInsureName;
  orderForm.ywxtype = plan?.additionalInsureId;
  orderForm.ywxName = plan?.additionalInsureName;
};

const getOrderDetail = async (id: number | string) => {
  const {
    consignTime,
    customer,
    emailAdd,
    emailMain,
    endTime,
    locationtype,
    lzxtype,
    orderSn,
    period,
    remark,
    safetype,
    shippingCode,
    shippingCodeAdd,
    ywxtype,
  } = await OrderGetApi(id);

  orderForm.consignTime = consignTime!;
  orderForm.customer = customer!;
  orderForm.emailAdd = emailAdd!;
  orderForm.emailMain = emailMain!;
  orderForm.endTime = endTime!;
  orderForm.locationtype = locationtype!;
  orderForm.lzxtype = lzxtype!;
  orderForm.orderSn = orderSn!;
  orderForm.period = period!;
  orderForm.remark = remark!;
  orderForm.safetype = safetype!;
  orderForm.shippingCode = shippingCode!;
  orderForm.shippingCodeAdd = shippingCodeAdd!;
  orderForm.ywxtype = ywxtype!;
  await getGroupList(Number(customer));
  const plan = planList.value.find((item: any) => item.groupId === safetype);
  orderForm.safeid = plan?.id;
  await setPolicy(orderForm.safeid);
};

const disabledBegin = (time: { getTime: () => number }) => {
  return time.getTime() < Date.now();
};

const disabledEnd = (time: { getTime: () => number }) => {
  return (
    time.getTime() < moment(orderForm.consignTime).valueOf() + 8.64e7 ||
    time.getTime() < Date.now()
  );
};

const resetEndTime = () => {
  if (
    moment(orderForm.consignTime).valueOf() >
    moment(orderForm.endTime).valueOf()
  ) {
    orderForm.endTime = '';
  }
};

const { copy, copied, isSupported } = useClipboard();
const handleCopy = () => {
  if (!isSupported) {
    ElMessage.error('浏览器不支持复制功能');
    return;
  }

  if (!orderForm.insureSn) {
    ElMessage.error('请选择保险编码');
    return;
  }

  copy(orderForm.insureSn);

  if (copied) {
    ElMessage.success('保险编码已成功复制到剪贴板');
  } else {
    ElMessage.error('复制保险编码失败，请重试');
  }
};

onMounted(async () => {
  id.value = route.query.id as string;

  getCustomerList();
  if (id.value) {
    getOrderDetail(id.value);
  }
});
</script>

<template>
  <Page :title="`${id ? '更新' : '新建'}订单`" v-loading="loading">
    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <ElForm
        ref="orderFormRef"
        :model="orderForm"
        :rules="rules"
        class="demo-orderForm"
        label-width="auto"
        status-icon
      >
        <ElRow :gutter="20">
          <ElCol :md="8">
            <ElFormItem label="所属客户" prop="customer">
              <ElSelect v-model="orderForm.customer" @change="getGroupList">
                <ElOption
                  v-for="item in customerList"
                  :key="item.id"
                  :label="item.username"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="起保日期" prop="consignTime">
              <ElDatePicker
                v-model="orderForm.consignTime"
                :disabled-date="disabledBegin"
                placeholder="请选择"
                type="date"
                @change="resetEndTime"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="终保日期" prop="endTime">
              <ElDatePicker
                v-model="orderForm.endTime"
                :disabled-date="disabledEnd"
                placeholder="请选择"
                type="date"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保险编码" prop="safeid">
              <div class="flex w-full gap-2">
                <ElSelect
                  v-model="orderForm.safeid"
                  :no-data-text="
                    orderForm.customer
                      ? '此客户未添加保险方案'
                      : '请先选择所属客户'
                  "
                  class="flex-1"
                  @change="setPolicy"
                >
                  <ElOption
                    v-for="item in planList"
                    :key="item.id"
                    :label="item.insureSn"
                    :value="item.id"
                  />
                </ElSelect>
                <ElButton type="primary" @click="handleCopy"> 复制 </ElButton>
              </div>
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="主险" prop="lzxName">
              <ElInput
                v-model="orderForm.lzxName"
                placeholder="请输入"
                readonly
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="附加险" prop="ywxName">
              <ElInput
                v-model="orderForm.ywxName"
                placeholder="请输入"
                readonly
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="主险保单号">
              <ElInput v-model="orderForm.shippingCode" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="主险邮箱" prop="emailMain">
              <ElInput v-model="orderForm.emailMain" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="附加险保单号">
              <ElInput
                v-model="orderForm.shippingCodeAdd"
                placeholder="请输入"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="附加险邮箱" prop="emailAdd">
              <ElInput v-model="orderForm.emailAdd" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="订单别名">
              <ElInput v-model="orderForm.orderSn" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput
                v-model="orderForm.remark"
                :autosize="{ minRows: 4 }"
                placeholder="请输入"
                type="textarea"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </ElCard>

    <Members
      v-if="!id"
      ref="memberRef"
      :insure-sn="orderForm.insureSn"
      :locationtype="orderForm.safeid"
    />

    <div class="mb-40 flex w-full justify-end">
      <ElButton v-if="id" type="primary" @click="updateForm(orderFormRef)">
        更新
      </ElButton>
      <ElButton v-else type="primary" @click="submitForm(orderFormRef)">
        提交
      </ElButton>
      <ElButton @click="back">取消</ElButton>
    </div>
  </Page>
</template>

<style scoped>
:deep(.footer-button .el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-form-item .el-date-editor) {
  width: 100%;
}
</style>
