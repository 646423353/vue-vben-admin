<script lang="ts" setup>
import type { FormInstance, UploadFiles, UploadProps } from 'element-plus';

import type { PolicyApi } from '#/api/core/policy';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

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
  ElRow,
  ElUpload,
} from 'element-plus';

import { PolicyGetApi } from '#/api/core/policy';
import { replaceUrlWithCurrentDomain } from '#/utils/formatPdfUrl';

import Members from '../components/Members.vue';

interface PolicyForm {
  uuid?: string;
  beginTime: number | string;
  beginTimes?: Date | string;
  endTime: number | string;
  endTimes?: Date | string;
  dt?: number | string;
  customerid: number | string;
  customername?: string;
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
  zhxbm?: string;
  zhx?: string;
  seq?: string;
  statusToubao?: number;
  statusToubaoText?: string;
  status?: number;
  statusText?: string;
  source?: number;
  feedback?: string;
  orderNo?: string;
}

const policyFormRef = ref<FormInstance>();
const policyForm = reactive<PolicyForm>({
  uuid: '',
  beginTime: '',
  customerid: '',
  customername: '',
  endTime: '',
  dt: '',
  orderid: '',
  payment: undefined,
  pdfurl: '',
  peoplecount: undefined,
  period: '',
  policyNo: '',
  postDae: '',
  tbCard: '',
  tbr: '',
  seq: '',
  tbrAddress: '',
  tbrCardtype: undefined,
  tbrEmail: '',
  tbrPhone: '',
  type: '',
  locationtype: '',
  pdfFileList: undefined,
  zhxbm: '',
  zhx: '',
  bxfa: '',
  bxfaId: '',
  priceShow: '',
  statusToubao: undefined,
  statusToubaoText: '',
  status: undefined,
  statusText: '',
  source: undefined,
  feedback: '',
  orderNo: '',
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
    uuid,
    beginTime,
    customername,
    endTime,
    dt,
    payment,
    pdfurl,
    peoplecount,
    period,
    policyNo,
    postDae,
    tbCard,
    tbr,
    tbrAddress,
    tbrCardtype,
    tbrEmail,
    tbrPhone,
    type,
    locationtype,
    zhxbm,
    zhx,
    bxfaId,
    bxfa,
    price,
    seq,
    statusToubao,
    status,
    source,
    feedback,
    orderNo,
  } = await PolicyGetApi(id);

  policyForm.uuid = uuid;
  policyForm.beginTimes = beginTime;
  policyForm.customername = customername;
  policyForm.endTimes = endTime;
  policyForm.dt = dt;
  policyForm.payment = payment;
  policyForm.pdfurl = pdfurl;
  policyForm.peoplecount = peoplecount;
  policyForm.policyNo = policyNo;
  policyForm.orderNo = orderNo;
  policyForm.postDae = postDae;
  policyForm.tbCard = tbCard;
  policyForm.tbr = tbr;
  policyForm.seq = seq;
  policyForm.tbrAddress = tbrAddress;
  policyForm.tbrCardtype = tbrCardtype;
  policyForm.tbrEmail = tbrEmail;
  policyForm.tbrPhone = tbrPhone;
  policyForm.type = type;
  policyForm.locationtype = locationtype;
  policyForm.zhxbm = zhxbm;
  policyForm.zhx = zhx;
  policyForm.bxfaId = bxfaId;
  policyForm.bxfa = bxfa;
  policyForm.priceShow = `￥${price} / ${period === 0 ? '人 / 日' : '人 / 月'}`;
  // 判断pdfurl是否为一个链接
  const isUrl = /^https?:\/\//.test(pdfurl || '');

  if (isUrl && pdfurl) {
    // 如果是链接，从中提取文件名
    const fileName = pdfurl.split('/').pop() || 'file';
    // 构建成ElUpload可识别的数组格式
    policyForm.pdfFileList = [
      {
        name: fileName,
        status: 'success',
        uid: Date.now(),
        response: {
          result: pdfurl,
        },
      },
    ];
  } else {
    policyForm.pdfFileList =
      pdfurl === 'null' ? JSON.parse('[]') : JSON.parse(pdfurl || '[]');
  }
  policyForm.statusToubaoText =
    statusToubao === 0
      ? '未投保'
      : statusToubao === 1
        ? '投保中'
        : statusToubao === 2
          ? '投保成功'
          : statusToubao === 3
            ? '投保失败'
            : '';
  policyForm.statusText =
    status === 0
      ? '未起保'
      : status === 1
        ? '保障中'
        : status === 2
          ? '已失效'
          : status === 3
            ? '已退保'
            : status === 4
              ? '投保中'
              : status === 5
                ? '投保失败'
                : '';
  policyForm.source = source;
  policyForm.feedback = feedback;
};

const previewPdfUrl = ref('');

const isPDF = (url: string) => {
  if (!url) return false;
  const mimeType = url!.split('.').pop()!.toLowerCase();
  const pdfMimeType = 'pdf';

  return mimeType === pdfMimeType;
};

interface FileResponse {
  result: string;
}

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

  if (id.value) {
    getOrderDetail(id.value);
  }
});
</script>

<template>
  <Page title="保单信息">
    <ElForm
      ref="policyFormRef"
      :model="policyForm"
      class="demo-policyForm"
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
            <ElFormItem label="保单系统编号">
              <ElInput v-model="policyForm.uuid" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保单号">
              <ElInput v-model="policyForm.policyNo" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="起保日期">
              <ElDatePicker
                v-model="policyForm.beginTimes"
                readonly
                type="date"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="终保日期">
              <ElDatePicker
                v-model="policyForm.endTimes"
                readonly
                type="date"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="创建时间">
              <ElDatePicker v-model="policyForm.dt" readonly type="datetime" />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保险编码">
              <ElInput v-model="policyForm.zhxbm" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="保险组合名称">
              <ElInput v-model="policyForm.zhx" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="8">
            <ElFormItem label="主险或附加险">
              <ElInput
                :value="policyForm.type === '1' ? '主险' : '附加险'"
                readonly
              />
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
              <ElInput
                :value="
                  policyForm.tbrCardtype === '1' ? '身份证' : '统一信用代码'
                "
                readonly
              />
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

      <Members ref="memberRef" :policy-id="id" />

      <ElCard class="mb-4">
        <template #header>
          <div class="card-header">
            <span>关联信息</span>
          </div>
        </template>
        <ElRow :gutter="20">
          <ElCol :md="12">
            <ElFormItem label="所属订单号">
              <ElInput v-model="policyForm.orderNo" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="所属客户名称">
              <ElInput v-model="policyForm.customername" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保操作编号">
              <ElInput v-model="policyForm.seq" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="投保操作状态">
              <ElInput v-model="policyForm.statusToubaoText" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="保单来源">
              <ElInput
                :value="policyForm.source === 0 ? '自动投保' : '保单回录'"
                readonly
              />
            </ElFormItem>
          </ElCol>
          <ElCol :md="12">
            <ElFormItem label="保单状态">
              <ElInput v-model="policyForm.statusText" readonly />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="自动投保反馈信息">
              <ElInput
                v-model="policyForm.feedback"
                :autosize="{ minRows: 4 }"
                readonly
                type="textarea"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="合同文件">
              <ElUpload
                :file-list="policyForm.pdfFileList"
                :on-preview="handlePreview"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElCard>
    </ElForm>

    <div class="mb-40 flex w-full justify-end">
      <ElButton @click="back">关闭</ElButton>
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

:deep(.el-upload) {
  display: none;
}

:deep(.el-upload-list) {
  margin-top: 0;
}

:deep(.el-upload-list__item .el-icon--close) {
  display: none;
}
</style>
