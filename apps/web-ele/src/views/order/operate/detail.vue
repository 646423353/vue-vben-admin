<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElRow,
} from 'element-plus';

import { OrderGetApi } from '#/api/core/order';

// import Insurance from '../components/Insurance.vue';
import Members from '../components/Members.vue';

export interface MemberDto {
  bxbm: string;
  comment: string;
  comment2: string;
  creditcard: string;
  id?: number;
  operateTag?: number;
  userid: number;
  username: string;
}

export interface OrderForm {
  consignTime: string;
  customer: string;
  customerName?: string;
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
  mainInsure?: string;
  addiInsure?: string;
}

const orderFormRef = ref<FormInstance>();
const orderForm = reactive<OrderForm>({
  consignTime: '',
  customer: '',
  customerName: '',
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
  mainInsure: '',
  addiInsure: '',
});

const router = useRouter();
const route = useRoute();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');

const back = () => {
  closeCurrentTab();
  router.back();
};

const memberRef = ref<any>(null);

const getOrderDetail = async (id: number | string) => {
  const {
    consignTime,
    customer,
    customerName,
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
    mainInsure,
    addiInsure,
  } = await OrderGetApi(id);

  orderForm.consignTime = consignTime!;
  orderForm.customer = customer!;
  orderForm.customerName = customerName;
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
  orderForm.mainInsure = mainInsure;
  orderForm.addiInsure = addiInsure;
};

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getOrderDetail(id.value);
  }
});
</script>

<template>
  <Page title="订单信息">
    <ElCard class="mb-4">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      <ElForm
        ref="orderFormRef"
        :model="orderForm"
        class="demo-orderForm"
        label-width="auto"
        status-icon
      >
        <ElRow :gutter="20">
          <ElCol :md="8">
            <ElFormItem label="所属客户">
              <ElInput v-model="orderForm.customerName" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="起保日期">
              <ElDatePicker
                v-model="orderForm.consignTime"
                readonly
                type="date"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="终保日期">
              <ElDatePicker v-model="orderForm.endTime" readonly type="date" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保险编码">
              <ElInput v-model="orderForm.locationtype" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="主险">
              <ElInput v-model="orderForm.mainInsure" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="附加险">
              <ElInput v-model="orderForm.addiInsure" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="主险保单号">
              <ElInput v-model="orderForm.shippingCode" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="主险邮箱">
              <ElInput v-model="orderForm.emailMain" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="附加险保单号">
              <ElInput v-model="orderForm.shippingCodeAdd" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="附加险邮箱">
              <ElInput v-model="orderForm.emailAdd" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="订单别名">
              <ElInput v-model="orderForm.orderSn" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput
                v-model="orderForm.remark"
                :autosize="{ minRows: 4 }"
                readonly
                type="textarea"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </ElCard>

    <Members
      ref="memberRef"
      :locationtype="orderForm.safeid"
      :order-id="id"
      :order-info="orderForm"
    />

    <!-- <Insurance
      ref="memberRef"
      :locationtype="orderForm.safeid"
      :order-id="id"
      :order-info="orderForm"
    /> -->

    <div class="mb-40 flex w-full justify-end">
      <ElButton @click="back">关闭</ElButton>
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
