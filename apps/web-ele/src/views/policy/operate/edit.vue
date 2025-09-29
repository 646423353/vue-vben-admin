<script lang="ts" setup>
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles,
  UploadProps,
} from 'element-plus';

import type { PolicyApi } from '#/api/core/policy';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { UiwCloudUpload } from '@vben/icons';

import VueOfficePdf from '@vue-office/pdf';
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
  ElRow,
  ElSelect,
  ElUpload,
} from 'element-plus';
import moment from 'moment';

import { CustomerListApi } from '#/api/core/customer';
import { InsureGetApi } from '#/api/core/insure';
import { OrderGetApi, OrderListApi, OrderMembersApi } from '#/api/core/order';
import { PolicyAddApi } from '#/api/core/policy';
import { usePolicyStore } from '#/store/policy';
import { replaceUrlWithCurrentDomain } from '#/utils/formatPdfUrl';

import Members from '../components/Members.vue';

interface PolicyForm {
  beginTime: number | string;
  beginTimes?: Date | string;
  endTime: number | string;
  endTimes?: Date | string;
  customerid: number | string;
  orderid: number | string;
  payment?: number;
  pdfurl?: string;
  peoplecount?: number;
  period?: number | string;
  policyNo?: string;
  postDae?: string;
  tbCard?: string;
  tbr?: string;
  tbrAddress?: string;
  tbrCardtype?: number | string;
  tbrEmail?: string;
  tbrPhone?: string;
  type?: number | string;
  locationtype?: number | string;
  bxfa?: string;
  bxfaId?: number | string;
  price?: string;
  priceShow?: string;
  members?: PolicyApi.MemberDto[];
  pdfFileList?: undefined | UploadFiles;
}

const policyFormRef = ref<FormInstance>();
const policyForm = reactive<PolicyForm>({
  beginTime: '',
  customerid: '',
  endTime: '',
  orderid: '',
  payment: undefined,
  pdfurl: '',
  peoplecount: undefined,
  period: '',
  policyNo: '',
  postDae: '',
  tbCard: '',
  tbr: '',
  tbrAddress: '',
  tbrCardtype: undefined,
  tbrEmail: '',
  tbrPhone: '',
  type: '',
  locationtype: '',
  pdfFileList: undefined,
});

const rules = reactive<FormRules<PolicyForm>>({
  orderid: [
    {
      required: true,
      message: '请选择订单',
      trigger: 'change',
    },
  ],
  customerid: [
    {
      required: true,
      message: '请选择客户',
      trigger: 'change',
    },
  ],
  policyNo: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value && !policyForm.pdfFileList) {
          callback();
        } else if (!value && policyForm.pdfFileList?.length !== 0) {
          callback(new Error('请输入保单号'));
        } else {
          callback();
        }
      },
      message: '请输入保单号',
      trigger: 'blur',
    },
  ],
  beginTimes: [
    {
      required: true,
      message: '请选择起保日期',
      trigger: 'change',
    },
  ],
  endTimes: [
    {
      required: true,
      message: '请选择终保日期',
      trigger: 'change',
    },
  ],
  type: [
    {
      required: true,
      message: '请选择主险或附加险',
      trigger: 'blur',
    },
  ],
});

const store = usePolicyStore();
const router = useRouter();
const route = useRoute();

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
      policyForm.beginTime = moment(policyForm.beginTimes).valueOf();
      policyForm.endTime = moment(policyForm.endTimes).valueOf();
      const membersList = await getMemberList(
        policyForm.orderid,
        policyForm.beginTime,
      );

      policyForm.members = membersList;

      policyForm.pdfurl = JSON.stringify(policyForm.pdfFileList);

      loading.value = true;
      const result = await PolicyAddApi({
        ...policyForm,
        beginTime: String(policyForm.beginTime),
        endTime: String(policyForm.endTime),
        members: membersList,
      });
      ElMessage.success(`${result}`);
      store.changePolicyStatus(true);
      back();
      resetForm(formEl);
      loading.value = false;
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

const getMemberList = async (
  orderId: number | string,
  insureTime: Date | number | string,
) => {
  const { list } = await OrderMembersApi(
    {
      orderId,
      insureTime: insureTime ? moment(insureTime).valueOf() : undefined,
    },
    {
      page: 1,
      size: policyForm.peoplecount!,
    },
  );
  const members = list.map((item: PolicyApi.MemberDto) => ({
    ...item,
    cardtype: '身份证',
  }));
  return members;
};

const orderList = ref<any>(null);
const getOrderList = async (customer?: number) => {
  const { list } = await OrderListApi(
    {
      customer: customer?.toString(),
    },
    {
      page: 1,
      size: 2000,
    },
  );
  orderList.value = list;
};

interface InsureForm {
  mainInsureId: number | string;
  mainInsure?: string;
  additionalInsureId: number | string;
  additionalInsure?: string;
}

const insureInfo = reactive<InsureForm>({
  mainInsureId: '',
  mainInsure: '',
  additionalInsureId: '',
  additionalInsure: '',
});

const setPolicyDetail = async (id: number | string) => {
  policyForm.customerid = '';
  policyForm.endTime = '';
  policyForm.locationtype = '';
  policyForm.bxfa = '';
  policyForm.bxfaId = '';
  policyForm.type = '';
  policyForm.price = '';
  policyForm.priceShow = '';
  insureInfo.mainInsure = '';
  insureInfo.mainInsureId = '';
  insureInfo.additionalInsure = '';
  insureInfo.additionalInsureId = '';
  if (!id) return;
  const {
    customer,
    locationtype,
    mainInsure,
    lzxtype,
    addiInsure,
    ywxtype,
    tbCard,
    tbrName,
    tbcardtype,
    tbrPhone,
  } = await OrderGetApi(id);

  policyForm.customerid = customer!;
  policyForm.locationtype = locationtype!;
  insureInfo.mainInsure = mainInsure!;
  insureInfo.mainInsureId = lzxtype!;
  insureInfo.additionalInsure = addiInsure!;
  insureInfo.additionalInsureId = ywxtype!;
  policyForm.tbCard = tbCard!;
  policyForm.tbr = tbrName!;
  policyForm.tbrCardtype = tbcardtype!;
  policyForm.tbrPhone = tbrPhone!;
};

// const disabledBegin = (time: { getTime: () => number }) => {
//   return time.getTime() < Date.now();
// };

const disabledEnd = (time: { getTime: () => number }) => {
  return (
    time.getTime() < moment(policyForm.beginTimes).valueOf() + 8.64e7
    //  || time.getTime() < Date.now()
  );
};

const resetEndTime = () => {
  if (
    moment(policyForm.beginTimes).valueOf() >
    moment(policyForm.endTimes).valueOf()
  ) {
    policyForm.endTime = '';
  }
};

const getInsurePrice = async (id: number | string) => {
  const { days, money } = await InsureGetApi(id);
  return { days, money };
};

const setInsureInfoAndPrice = async () => {
  if (policyForm.type === '0') {
    policyForm.bxfaId = insureInfo.mainInsureId;
    policyForm.bxfa = insureInfo.mainInsure;
  } else {
    policyForm.bxfaId = insureInfo.additionalInsureId;
    policyForm.bxfa = insureInfo.additionalInsure;
  }
  const { days, money } = await getInsurePrice(policyForm.bxfaId);
  policyForm.period = Number(days) === 1 ? 0 : 1;
  policyForm.priceShow = `￥${money} / ${Number(days) === 1 ? '人 / 日' : '人 / 月'}`;
  policyForm.price = money;
  const total = memberRef.value?.totalValue || 0;
  calcPayment(total);
};

const calcPayment = (total: number) => {
  if (!total || !policyForm.price) return;
  policyForm.peoplecount = total;
  policyForm.payment = total * Number(policyForm.price);
};

const uploadUrl = import.meta.env.VITE_UPLOAD_URL;

const beforeFileUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  const validExtensions = [
    // 'png',
    // 'jpeg',
    // 'jpg',
    'pdf',
  ];
  const validMimeTypes = [
    // 'image/png',
    // 'image/jpeg',
    'application/pdf',
  ];

  if (!rawFile) return false;

  const rawFileTypeName = rawFile?.name?.split('.').pop()?.toLowerCase();
  const isImageOrPdf =
    validExtensions.includes(rawFileTypeName || '') ||
    validMimeTypes.includes(rawFile.type);

  const isLt2M = rawFile.size / 1024 / 1024 < 20;

  if (!isImageOrPdf) {
    await ElMessage.error('请上传PDF格式文件');
  }
  if (!isLt2M) {
    await ElMessage.error('文件大小不能超过 20MB');
  }

  return isImageOrPdf && isLt2M;
};

const handleChange = (file: UploadFile, fileList: UploadFiles) => {
  policyForm.pdfFileList = fileList;
};

const handleSuccess: UploadProps['onSuccess'] = ({ code, message }) => {
  if (code === 200) {
    ElMessage.success('上传成功');
  } else {
    ElMessage.error(`${message}，请重新上传`);
  }
};

const isPDF = (url: string) => {
  if (!url) return false;
  const mimeType = url!.split('.').pop()!.toLowerCase();
  const pdfMimeType = 'pdf';

  return mimeType === pdfMimeType;
};
interface FileResponse {
  result: string;
}

const previewPdfUrl = ref('');

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  showConfirmButton: false,
  cancelText: '关闭',
});

const handlePreview: UploadProps['onPreview'] = (file) => {
  const url: string = (file.response as FileResponse).result;
  if (isPDF(url)) {
    previewPdfUrl.value = replaceUrlWithCurrentDomain(url);
    modalApi.open();
  } else {
    return ElMessage.error('此文件类型不支持预览');
  }
};

const renderedHandler = () => {};
const errorHandler = () => {
  console.error('渲染失败');
};

onMounted(async () => {
  id.value = route.query.id as string;

  getCustomerList();
  getOrderList();
});
</script>

<template>
  <Page title="保单回录" v-loading="loading">
    <ElForm
      ref="policyFormRef"
      :model="policyForm"
      :rules="rules"
      class="demo-policyForm"
      label-width="auto"
      status-icon
      style="min-width: 600px"
    >
      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>关联信息</span>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="12">
            <ElFormItem label="所属订单号">
              <ElSelect
                v-model="policyForm.orderid"
                no-data-text="您还没有添加订单，请先添加订单"
                class="flex-1"
                @change="setPolicyDetail"
                clearable
              >
                <ElOption
                  v-for="item in orderList"
                  :key="item.id"
                  :label="item.orderId"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="所属客户" prop="customerid">
              <ElSelect
                v-model="policyForm.customerid"
                @change="getOrderList"
                clearable
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
        </ElRow>
      </ElCard>

      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="8">
            <ElFormItem label="保单号" prop="policyNo">
              <ElInput v-model="policyForm.policyNo" placeholder="请输入" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="起保日期" prop="beginTimes">
              <ElDatePicker
                v-model="policyForm.beginTimes"
                placeholder="请选择"
                type="date"
                @change="resetEndTime"
              />
              <!-- :disabled-date="disabledBegin" -->
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="终保日期" prop="endTimes">
              <ElDatePicker
                v-model="policyForm.endTimes"
                placeholder="请选择"
                type="date"
                :disabled-date="disabledEnd"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保险编码">
              <ElInput v-model="policyForm.locationtype" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="主险或附加险" prop="type">
              <ElSelect
                v-model="policyForm.type"
                @change="setInsureInfoAndPrice"
              >
                <ElOption label="主险" value="0" />
                <ElOption label="附加险" value="1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="方案名">
              <ElInput v-model="policyForm.bxfa" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="方案ID">
              <ElInput v-model="policyForm.bxfaId" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="方案单价">
              <ElInput v-model="policyForm.priceShow" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保费">
              <ElInput v-model="policyForm.payment" readonly />
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
              <ElInput v-model="policyForm.tbr" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人证件类型">
              <ElSelect v-model="policyForm.tbrCardtype" readonly>
                <ElOption label="统一信用代码" value="0" />
                <ElOption label="身份证" value="1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人证件号">
              <ElInput v-model="policyForm.tbCard" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保人手机号">
              <ElInput v-model="policyForm.tbrPhone" readonly />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElCard>

      <Members
        ref="memberRef"
        :order-id="policyForm.orderid"
        :insure-time="policyForm.beginTimes"
        @calc-payment="calcPayment"
      />

      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>保单文件</span>
          </div>
        </template>
        <ElFormItem>
          <ElUpload
            :action="uploadUrl"
            :before-upload="beforeFileUpload"
            :file-list="policyForm.pdfFileList"
            :limit="1"
            :on-change="handleChange"
            :on-preview="handlePreview"
            :on-remove="handleChange"
            :on-success="handleSuccess"
            accept=".pdf,application/pdf"
            class="w-full"
            drag
          >
            <div class="flex justify-center">
              <UiwCloudUpload class="size-10" />
            </div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上传pdf文件，且不超过20mb</div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElCard>
    </ElForm>

    <div class="mb-40 flex w-full justify-end">
      <ElButton type="primary" @click="submitForm(policyFormRef)">
        提交
      </ElButton>
      <ElButton @click="back">取消</ElButton>
    </div>

    <Modal class="w-[80%]" title="文件预览">
      <VueOfficePdf
        :src="previewPdfUrl"
        @error="errorHandler"
        @rendered="renderedHandler"
      />
    </Modal>
  </Page>
</template>

<style scoped>
:deep(.footer-button .el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-form-item .el-date-editor) {
  width: 100%;
}

:deep(.el-form-item .el-input) {
  width: 100%;
}

:deep(.el-form-item .el-select) {
  width: 100%;
}
</style>
