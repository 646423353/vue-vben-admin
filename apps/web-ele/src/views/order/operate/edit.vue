<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { useAccessStore, useUserIdStore } from '@vben/stores';

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
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import { CustomerGetApi, CustomerListApi } from '#/api/core/customer';
import { OrderAddApi, OrderGetApi, OrderUpdateApi } from '#/api/core/order';
import { PlanListApi } from '#/api/core/plan';
import { useOrderStore } from '#/store/order';

import HistoryInsuredModal from '../components/HistoryInsuredModal.vue';
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
  stopName: string;
  idNum: string;
}

interface OrderForm {
  consignTime: Date | string;
  customer: string;
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
  tbrName?: string;
  tbCardtype?: string;
  tbCard?: string;
  tbrPhone?: string;
  tbrEmail?: string;
  tbrAddress?: string;
  needsynctag?: number;
  tbType?: number;
  tbTypeZx?: number;
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
  tbrName: '',
  tbCardtype: '',
  tbCard: '',
  tbrPhone: '',
  tbrEmail: '',
  tbrAddress: '',
  needsynctag: 0,
  tbType: 0,
  tbTypeZx: 1,
});

const customerBatchTime = ref<string>('');
const nominalScope = ref<number>(1); // 0: None, 1: Addi, 2: Main, 3: Both

// Watch for scope changes to update form values
// tbType控制附加险, tbTypeZx控制主险 (0=投保, 1=不投保)
watch(nominalScope, (val) => {
  switch (val) {
    case 0: {
      // 都不投保: tbType=1(附加险不投保), tbTypeZx=1(主险不投保)
      orderForm.tbType = 1;
      orderForm.tbTypeZx = 1;
      break;
    }
    case 1: {
      // 只投附加险(Addi): tbType=0(附加险投保), tbTypeZx=1(主险不投保)
      orderForm.tbType = 0;
      orderForm.tbTypeZx = 1;
      break;
    }
    case 2: {
      // 只投主险(Main): tbType=1(附加险不投保), tbTypeZx=0(主险投保)
      orderForm.tbType = 1;
      orderForm.tbTypeZx = 0;
      break;
    }
    case 3: {
      // 两个都投: tbType=0(附加险投保), tbTypeZx=0(主险投保)
      orderForm.tbType = 0;
      orderForm.tbTypeZx = 0;
      break;
    }
  }
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
      message: '请选择起保时间',
      trigger: 'change',
    },
  ],
  endTime: [
    {
      required: true,
      message: '请选择终保时间',
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
  tbrName: [
    {
      required: true,
      message: '请输入投保人名称',
      trigger: 'blur',
    },
  ],
  tbCardtype: [
    {
      required: true,
      message: '请选择投保人证件类型',
      trigger: 'blur',
    },
  ],
  tbCard: [
    {
      required: true,
      message: '请输入投保人证件号',
      trigger: 'blur',
    },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) callback();
        if (!orderForm.tbCardtype) {
          return callback(new Error('请选择投保人证件类型'));
        }
        if (orderForm.tbCardtype === '1') {
          if (!/^\d{17}[\dX]|\d{15}$/i.test(value)) {
            return callback(new Error('身份证格式错误'));
          }
        } else if (
          orderForm.tbCardtype === '0' &&
          !/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(value)
        ) {
          return callback(new Error('统一信用代码格式错误'));
        }
        callback();
      },
      trigger: ['blur', 'change'],
    },
  ],
  tbrPhone: [
    {
      required: true,
      message: '请输入投保人手机号',
      trigger: 'blur',
    },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) callback();
        if (!/^1[3-9]\d{9}$/.test(value)) {
          return callback(new Error('手机号格式错误'));
        }
        callback();
      },
      trigger: ['blur', 'change'],
    },
  ],
  tbrEmail: [
    {
      validator: validateEmail,
      trigger: 'blur',
    },
  ],
});

const store = useOrderStore();
const accessStore = useAccessStore();
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

/** 历史投保人面板是否展示 */
const showHistoryPanel = ref(false);

// ─── 编辑模式下的原始日期（用于日期锁定判断） ─────────────────────────
/** 数据库中记录的原始起保时间 */
const originalConsignTime = ref<string>('');
/** 数据库中记录的原始终保时间 */
const originalEndTime = ref<string>('');
/** 数据库中记录的原始保险编码（用于检测是否发生变更） */
const originalInsureSn = ref<string>('');

/**
 * 规则①：起保日期锁定
 * 当前时间超过订单起保前一日的 20:00，则不可修改起保日期
 */
const isConsignTimeLocked = computed(() => {
  if (!id.value || !originalConsignTime.value) return false;
  const lockPoint = moment(originalConsignTime.value)
    .subtract(1, 'day')
    .hour(20)
    .minute(0)
    .second(0);
  return moment().isAfter(lockPoint);
});

/**
 * 规则③：终保日期锁定
 * 当前日期已晚于原终保日期（订单已全量减员失效），则不可修改终保日期
 */
const isEndTimeLocked = computed(() => {
  if (!id.value || !originalEndTime.value) return false;
  return moment().isAfter(moment(originalEndTime.value).endOf('day'));
});

/**
 * 规则⑦： 20:00-24:00 期间不允许修改订单
 */
const isInLockPeriod = computed(() => {
  return moment().hour() >= 20;
});

/**
 * 选中历史投保人后自动填充各字段
 */
const handleInsuredSelect = (insured: {
  tbCard: string;
  tbCardtype: string;
  tbrAddress?: string;
  tbrEmail?: string;
  tbrName: string;
  tbrPhone: string;
}) => {
  orderForm.tbrName = insured.tbrName;
  orderForm.tbCardtype = insured.tbCardtype;
  orderForm.tbCard = insured.tbCard;
  orderForm.tbrPhone = insured.tbrPhone;
  orderForm.tbrAddress = insured.tbrAddress ?? '';
  orderForm.tbrEmail = insured.tbrEmail ?? '';
};

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
          username: item['姓名*'],
          creditcard: item['身份证*'],
          bxbm: item['保险编码*'],
          stopName: item.所属站点名称,
          idNum: item.骑手编号,
          comment: item.备注1,
          comment2: item.备注2,
          userid: useridStore.userId,
        };
      });

      orderForm.consignTime = new Date(orderForm.consignTime);
      orderForm.endTime = new Date(
        `${moment(orderForm.endTime).format('YYYY-MM-DD')} 23:59:59`,
      );

      if (formatData.length === 1 && formatData[0].username === '模板-张三') {
        ElMessage.error('请上传人员清单');
        return;
      }

      if ((await memberRef.value?.fullValidEvent()) === false) {
        ElMessage.error('请检查人员清单');
        return;
      }
      loading.value = true;
      const result = await OrderAddApi({
        ...orderForm,
        memberDtos: formatData,
      });
      ElMessage.success(`${result}`);
      store.changeOrderStatus(true);
      back();
      resetForm(formEl);
      loading.value = false;
    } else {
      loading.value = false;
      console.error('error submit!', fields);
    }
  });
};

const updateForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  // 规则⑦：每天 20:00-24:00 不允许修改订单
  if (isInLockPeriod.value) {
    ElMessage.error(
      '每天 20:00-24:00 期间不允许修订订单信息，请在该时间段外操作',
    );
    return;
  }

  await formEl.validate(async (valid, fields) => {
    if (valid) {
      // 规则⑧：起保时刻必须是 00:00:00
      orderForm.consignTime = new Date(
        `${moment(orderForm.consignTime).format('YYYY-MM-DD')} 00:00:00`,
      );
      // 规则⑧：终保时刻必须是 23:59:59
      orderForm.endTime = new Date(
        `${moment(orderForm.endTime).format('YYYY-MM-DD')} 23:59:59`,
      );

      // 规则 2.2：检测保险编码是否发生变更，如发生变更则携带原始保险编码信息让后端记录日志
      const insureSnChanged =
        originalInsureSn.value && orderForm.insureSn !== originalInsureSn.value;

      const result = await OrderUpdateApi({
        id: Number(id.value),
        ...orderForm,
        ...(insureSnChanged ? { oldInsureSn: originalInsureSn.value } : {}),
      } as any);
      ElMessage.success(`${result}`);
      store.changeOrderStatus(true);
      back();
      resetForm(formEl);
    } else {
      loading.value = false;
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
      withTag: 0,
      withStop: 0,
      withInsure: 0,
    },
  );
  customerList.value = list;
};

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

const handleCustomerChange = async (id: number) => {
  await getGroupList(id);
  await getCustomerDetail(id);
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
      validTag: 1,
      status: 1,
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
    needsynctag,
    tbrAddress,
    remark,
    safetype,
    shippingCode,
    shippingCodeAdd,
    ywxtype,
    tbrName,
    tbcardtype,
    tbCard,
    tbrPhone,
    tbrEmail,
    tbType,
    tbTypeZx,
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
  orderForm.needsynctag = needsynctag!;
  orderForm.remark = remark!;
  orderForm.safetype = safetype!;
  orderForm.shippingCode = shippingCode!;
  orderForm.shippingCodeAdd = shippingCodeAdd!;
  orderForm.ywxtype = ywxtype!;
  orderForm.tbrName = tbrName;
  orderForm.tbCardtype = tbcardtype;
  orderForm.tbCard = tbCard;
  orderForm.tbrPhone = tbrPhone;
  orderForm.tbrEmail = tbrEmail;
  orderForm.tbrAddress = tbrAddress;
  orderForm.tbType = tbType === undefined ? 0 : tbType;
  orderForm.tbTypeZx = tbTypeZx === undefined ? 1 : tbTypeZx;

  // 保存原始日期 / 保险编码，用于日期锁定判断和修改日志
  originalConsignTime.value = consignTime as string;
  originalEndTime.value = endTime as string;
  originalInsureSn.value = orderForm.insureSn ?? '';

  // Set nominalScope based on tbType/tbTypeZx
  // tbType控制附加险, tbTypeZx控制主险 (0=投保, 1=不投保)
  if (orderForm.tbType === 1 && orderForm.tbTypeZx === 1)
    nominalScope.value = 0; // 都不投保
  else if (orderForm.tbType === 0 && orderForm.tbTypeZx === 1)
    nominalScope.value = 1; // 只投附加险(Addi)
  else if (orderForm.tbType === 1 && orderForm.tbTypeZx === 0)
    nominalScope.value = 2; // 只投主险(Main)
  else if (orderForm.tbType === 0 && orderForm.tbTypeZx === 0)
    nominalScope.value = 3; // 两个都投

  await getGroupList(Number(customer));
  await getCustomerDetail(Number(customer));
  const plan = planList.value.find((item: any) => item.groupId === safetype);
  orderForm.safeid = plan?.id;
  await setPolicy(orderForm.safeid);
};

/**
 * 规则①②：起保日期禁用逻辑
 * - 编辑模式且已发生起保：全部禁用
 * - 编辑模式未起保：不能选今天及以前，必须 >= 明天
 * - 新建模式：保持原逻辑
 */
const disabledBegin = (time: { getTime: () => number }) => {
  if (id.value) {
    // 规则①：已起保，禁用所有日期
    if (isConsignTimeLocked.value) return true;
    // 规则②：未起保，不能选今天及以前（最早明天）
    return time.getTime() < moment().add(1, 'day').startOf('day').valueOf();
  }
  // 新建订单：允许今天起
  return time.getTime() < Date.now() - 8.64e7;
};

const defaultStartTime = new Date(2000, 1, 1, 0, 0, 0);
const defaultEndTime = new Date(2000, 1, 1, 23, 59, 59);

/**
 * 规则③④：终保日期禁用逻辑
 * - 编辑模式且订单已全部失效：禁用
 * - 编辑模式：不能选今天及以前，最早明天
 * - 新建模式：不能早于起保日
 */
const disabledEnd = (time: { getTime: () => number }) => {
  if (id.value) {
    // 规则③：订单已全量失效，禁用所有日期
    if (isEndTimeLocked.value) return true;
    // 规则④：终保日期不能为今天及以前，最早明天
    return time.getTime() < moment().add(1, 'day').startOf('day').valueOf();
  }
  // 新建订单：不能早于起保日
  const startOfDay = moment(orderForm.consignTime).startOf('day').valueOf();
  const timeStartOfDay = moment(time.getTime()).startOf('day').valueOf();
  return (
    timeStartOfDay < startOfDay ||
    timeStartOfDay < moment().startOf('day').valueOf()
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
    <ElForm
      ref="orderFormRef"
      :model="orderForm"
      :rules="rules"
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
            <ElFormItem label="所属客户" prop="customer">
              <ElSelect
                v-model="orderForm.customer"
                filterable
                @change="handleCustomerChange"
              >
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
            <ElFormItem label="起保时间" prop="consignTime">
              <ElDatePicker
                v-model="orderForm.consignTime"
                :default-time="defaultStartTime"
                :disabled-date="disabledBegin"
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择"
                type="datetime"
                @change="resetEndTime"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="终保时间" prop="endTime">
              <ElDatePicker
                v-model="orderForm.endTime"
                :default-time="defaultEndTime"
                :disabled-date="disabledEnd"
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择"
                type="datetime"
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
          <!-- <ElCol :md="12">
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
          </ElCol> -->
          <ElCol :span="24">
            <ElFormItem label="订单别名">
              <ElInput v-model="orderForm.orderSn" placeholder="请输入" />
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
                placeholder="请输入"
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
              <ElRadioGroup
                v-model="nominalScope"
                :disabled="
                  !accessStore.accessCodes.includes('1') &&
                  !accessStore.accessCodes.includes('13')
                "
              >
                <ElRadioButton :value="1">仅附加险</ElRadioButton>
                <ElRadioButton :value="2">仅主险</ElRadioButton>
                <ElRadioButton :value="3">主险和附加险</ElRadioButton>
                <ElRadioButton :value="0">完全关闭名义保单</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="客户批处理时间">
              <ElInput
                :value="customerBatchTime"
                placeholder="选择客户后显示"
                readonly
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElCard>

      <ElCard class="mb-4">
        <template #header>
          <div class="card-header flex items-center justify-between">
            <span>投保人</span>
            <!-- 仅新建模式且已选客户时才展示「快速选择」按鈕 -->
            <ElButton
              v-if="!id"
              type="primary"
              :disabled="!orderForm.customer"
              @click="showHistoryPanel = true"
            >
              快速选择历史投保人
            </ElButton>
          </div>
        </template>


        <ElRow :gutter="20">
          <ElCol :md="12">
            <ElFormItem label="投保人名称" prop="tbrName">
              <ElInput v-model="orderForm.tbrName" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人证件类型" prop="tbCardtype">
              <ElSelect
                v-model="orderForm.tbCardtype"
                placeholder="请选择"
                @change="orderForm.tbCard = ''"
              >
                <ElOption label="统一信用代码" value="0" />
                <ElOption label="身份证" value="1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人证件号" prop="tbCard">
              <ElInput v-model="orderForm.tbCard" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人手机号" prop="tbrPhone">
              <ElInput v-model="orderForm.tbrPhone" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人地址">
              <ElInput v-model="orderForm.tbrAddress" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人电子邮箱" prop="tbrEmail">
              <ElInput v-model="orderForm.tbrEmail" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElCard>
    </ElForm>

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

    <!-- 历史投保人快速选择弹窗 -->
    <HistoryInsuredModal
      v-model:visible="showHistoryPanel"
      :customer-id="orderForm.customer"
      @select="handleInsuredSelect"
    />
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
