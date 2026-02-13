<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useRefresh, useTabs } from '@vben/hooks';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElLoading,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import { CustomerGetApi } from '#/api/core/customer';
import {
  OrderGetApi,
  OrderGetPersonApi,
  OrderTaskAddApi,
  OrderUpdateApi,
} from '#/api/core/order';
import { TaskGetApi } from '#/api/core/task';

import Insurance from '../components/Insurance.vue';
import Log from '../components/Log.vue';
import Members from '../components/Members.vue';
import OrderLogDrawer from '../components/OrderLogDrawer.vue';
import Policy from '../components/Policy.vue';

export interface MemberDto {
  bxbm: string;
  comment: string;
  comment2: string;
  creditcard: string;
  id?: number;
  operateTag?: number;
  userid: number;
  username: string;
  stopName: string;
  idNum: string;
}

export interface OrderForm {
  consignTime: Date | string;
  customer: string;
  customerName?: string;
  created?: string;
  emailAdd: string;
  emailMain: string;
  endTime: Date | string;
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
  tbrName?: string;
  tbCardtype?: string;
  tbCard?: string;
  tbrPhone?: string;
  tbrEmail?: string;
  tbrAddress?: string;
  orderId?: string;
  needsynctag?: number;
  tbType?: number;
  tbTypeZx?: number;
}

const orderFormRef = ref<FormInstance>();
const orderForm = reactive<OrderForm>({
  consignTime: '',
  customer: '',
  customerName: '',
  created: '',
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
const { refresh } = useRefresh();
const id = ref<string>('');

const back = () => {
  closeCurrentTab();
  router.back();
};

const memberRef = ref<any>(null);
const insuranceRef = ref<any>(null);
const policyRef = ref<any>(null);
const LogRef = ref<any>(null);
const orderLogDrawerRef = ref<any>(null);

const customerBatchTime = ref<string>('');
const nominalScopeText = ref<string>('');

const { hasAccessByCodes } = useAccess();

const getCustomerDetail = async (id: number | string) => {
  if (!id) {
    customerBatchTime.value = '';
    return;
  }
  const res = await CustomerGetApi(id);
  customerBatchTime.value =
    res.stopHour === -1
      ? '不参与批量投保'
      : res.stopHour
        ? `${res.stopHour}:00`
        : '';
};

const handleDeleteOrder = async () => {
  try {
    await ElMessageBox.confirm('确认删除此订单吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const res = await OrderUpdateApi({
      id: Number(id.value),
      delTag: 1,
    } as any);

    if (res) {
      ElMessage.success('删除成功');
      closeCurrentTab();
      router.back();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
    }
  }
};

const getOrderDetail = async (id: number | string) => {
  const isDirect = route.query.source === 'direct';
  const res = isDirect ? await OrderGetPersonApi(id) : await OrderGetApi(id);
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
    tbrName,
    tbcardtype,
    tbCard,
    tbrPhone,
    tbrEmail,
    tbrAddress,
    orderId,
    needsynctag,
    tbType,
    tbTypeZx,
    created,
  } = res;

  // 兼容直投接口返回的 createTime
  const finalCreated = created || (res as any).createTime;

  orderForm.consignTime = consignTime!;
  orderForm.customer = customer!;
  orderForm.customerName = customerName;
  orderForm.created = finalCreated;
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
  orderForm.tbrName = tbrName;
  orderForm.tbCardtype = tbcardtype;
  orderForm.tbCard = tbCard;
  orderForm.tbrPhone = tbrPhone;
  orderForm.tbrEmail = tbrEmail;
  orderForm.tbrAddress = tbrAddress;
  orderForm.orderId = orderId;
  orderForm.needsynctag = needsynctag;

  // 名义保单显示: tbType控制附加险, tbTypeZx控制主险 (0=投保, 1=不投保)
  if (tbType === 1 && tbTypeZx === 1)
    nominalScopeText.value = '完全关闭名义保单';
  else if (tbType === 1 && tbTypeZx === 0) nominalScopeText.value = '仅主险';
  else if (tbType === 0 && tbTypeZx === 1) nominalScopeText.value = '仅附加险';
  else if (tbType === 0 && tbTypeZx === 0)
    nominalScopeText.value = '主险和附加险';
  else nominalScopeText.value = '仅附加险'; // 默认

  if (customer) {
    await getCustomerDetail(customer);
  }
};

const handleSupplementPolicy = async () => {
  const now = moment();
  const createTime = moment(orderForm.created);
  const consignTime = moment(orderForm.consignTime);
  const todayStr = now.format('YYYY-MM-DD');
  const limitTime = moment(`${todayStr} 19:20:00`);

  // 1. 当前时间必须在19:20之前
  if (now.isAfter(limitTime)) {
    ElMessageBox.alert(
      '不符合补投条件：需要在当天19:20:00前进行操作。',
      '提示',
      { confirmButtonText: '关闭' },
    );
    return;
  }

  // 2. 创建日必须是今天
  if (!createTime.isSame(now, 'day')) {
    ElMessageBox.alert(
      '不符合补投条件：只能对当天创建的订单进行补投操作。',
      '提示',
      { confirmButtonText: '关闭' },
    );
    return;
  }

  // 3. 起保日必须是今天
  if (!consignTime.isSame(now, 'day')) {
    ElMessageBox.alert(
      '不符合补投条件：只能对当天创建的订单进行补投操作。',
      '提示',
      {
        confirmButtonText: '关闭',
      },
    );
    return;
  }

  try {
    await ElMessageBox.confirm(
      '是否对订单创建日进行投保。保障起始时间为半小时后，终止时间为创建日23:59:59。',
      '确认弹窗',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    const loading = ElLoading.service({
      lock: true,
      text: '投保中，请勿关闭页面...',
      background: 'rgba(0, 0, 0, 0.7)',
    });

    try {
      if (id.value) {
        await OrderTaskAddApi({ orderId: id.value });

        const checkStatus = async () => {
          try {
            const res = await TaskGetApi();
            const { status, remark, policyCount, policyCountSuccess } = res;

            switch (status) {
              case 1: {
                // Success
                loading.close();
                const total = policyCount || 0;
                const success = policyCountSuccess || 0;
                const fail = total - success;
                const htmlMessage = `
                <div style="font-size: 15px; padding: 5px 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="width: 70px; color: #606266;">投保成功:</span>
                    <span style="color: #67C23A; font-weight: bold; font-size: 18px;">${success}</span>
                    <span style="margin: 0 5px; color: #C0C4CC;">/</span>
                    <span style="color: #909399;">${total}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="width: 70px; color: #606266;">投保失败:</span>
                    <span style="color: #F56C6C; font-weight: bold; font-size: 18px;">${fail}</span>
                    <span style="margin: 0 5px; color: #C0C4CC;">/</span>
                    <span style="color: #909399;">${total}</span>
                  </div>
                </div>
              `;
                await ElMessageBox.alert(htmlMessage, '投保完成', {
                  confirmButtonText: '关闭',
                  dangerouslyUseHTMLString: true,
                });
                await refresh();

                break;
              }
              case 2: {
                // Exception
                loading.close();
                await ElMessageBox.alert(
                  `自动投保运行异常结束，异常结束原因：${remark}`,
                  '提示',
                  {
                    confirmButtonText: '关闭',
                  },
                );

                break;
              }
              case 3: {
                // Paused
                loading.close();
                await ElMessageBox.alert('自动投保已暂停', '提示', {
                  confirmButtonText: '关闭',
                });

                break;
              }
              default: {
                // 0: Running, 4: Not Started - Continue polling
                setTimeout(checkStatus, 2000);
              }
            }
          } catch (error: any) {
            loading.close();
            console.error('Poll Task Status Error:', error);
            await ElMessageBox.alert(
              '获取任务状态失败，请联系管理员。',
              '提示',
              {
                confirmButtonText: '关闭',
              },
            );
          }
        };

        // Start polling
        checkStatus();
      }
    } catch (error: any) {
      loading.close();
      const errorMessage =
        error?.message ||
        (typeof error === 'string' ? error : '') ||
        '投保失败，请联系管理员。';
      await ElMessageBox.alert(errorMessage, '提示', {
        confirmButtonText: '关闭',
      });
    }
  } catch {
    // Cancelled
  }
};

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getOrderDetail(id.value);
  }
});
</script>

<template>
  <Page>
    <template #title>
      <div class="pb-2 pt-2 text-lg font-semibold">
        <span class="mr-4">订单信息</span>
        <span>{{ orderForm.orderId }}</span>
      </div>
    </template>
    <template #extra>
      <ElButton class="mr-2" @click="orderLogDrawerRef.open(id)">
        订单修订日志
      </ElButton>
      <ElButton type="primary" @click="handleSupplementPolicy">
        补投创建日保单
      </ElButton>
      <ElButton
        v-if="hasAccessByCodes(['1', '13']) && orderForm.needsynctag === 0"
        type="danger"
        @click="handleDeleteOrder"
      >
        删除订单
      </ElButton>
    </template>

    <OrderLogDrawer class="w-[800px]" ref="orderLogDrawerRef" />

    <ElForm
      ref="orderFormRef"
      :model="orderForm"
      class="demo-orderForm"
      label-width="auto"
      status-icon
    >
      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="8">
            <ElFormItem label="所属客户">
              <ElInput v-model="orderForm.customerName" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="起保时间">
              <ElDatePicker
                v-model="orderForm.consignTime"
                readonly
                type="datetime"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="终保时间">
              <ElDatePicker
                v-model="orderForm.endTime"
                readonly
                type="datetime"
              />
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
          <!-- <ElCol :md="12">
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
          </ElCol> -->
          <ElCol :span="24">
            <ElFormItem label="订单别名">
              <ElInput v-model="orderForm.orderSn" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="订单来源">
              <ElInput
                :value="
                  orderForm.needsynctag === 1
                    ? 'API自动匹配'
                    : orderForm.needsynctag === 2
                      ? 'API个人直投'
                      : '常规页面生成'
                "
                readonly
              />
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
      </ElCard>

      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>配置信息</span>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :span="24">
            <ElFormItem label="每日生成名义保单范围">
              <ElInput v-model="nominalScopeText" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="客户批处理时间">
              <ElInput :value="customerBatchTime || '未设置'" readonly />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElCard>

      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>投保人</span>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="12">
            <ElFormItem label="投保人名称">
              <ElInput v-model="orderForm.tbrName" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人证件类型">
              <ElSelect v-model="orderForm.tbCardtype" disabled>
                <ElOption label="统一信用代码" value="0" />
                <ElOption label="身份证" value="1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人证件号">
              <ElInput v-model="orderForm.tbCard" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人手机号">
              <ElInput v-model="orderForm.tbrPhone" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人地址">
              <ElInput v-model="orderForm.tbrAddress" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人电子邮箱">
              <ElInput v-model="orderForm.tbrEmail" readonly />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElCard>
    </ElForm>

    <Members
      ref="memberRef"
      :is-direct="route.query.source === 'direct'"
      :locationtype="orderForm.safeid"
      :order-id="id"
      :order-info="orderForm"
    />

    <Policy
      ref="policyRef"
      :locationtype="orderForm.safeid"
      :order-id="id"
      :order-info="orderForm"
    />

    <Log ref="LogRef" :order-id="id" />

    <Insurance
      ref="insuranceRef"
      :locationtype="orderForm.safeid"
      :order-id="id"
      :order-info="orderForm"
    />

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
