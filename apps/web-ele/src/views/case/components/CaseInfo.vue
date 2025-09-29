<script lang="ts" setup>
import type { FormInstance, UploadFiles } from 'element-plus';

import type { CaseApi } from '#/api/core/case';

import { reactive, ref, watch } from 'vue';

import { AntDownloadOutlined } from '@vben/icons';

import {
  ElCol,
  ElDivider,
  ElForm,
  ElFormItem,
  ElIcon,
  ElImage,
  ElLink,
  ElRow,
} from 'element-plus';

import { PlanListApi } from '#/api/core/plan';
import { formatTimestamp } from '#/utils/dateUtils';

export interface UploadForm {
  addressPictureList: UploadFiles;
  orderPictureList: UploadFiles;
  accidentPictureList: UploadFiles;
  cardPictureList: UploadFiles;
  diseasePictureList: UploadFiles;
  ticketPictureList: UploadFiles;
  goodPictureList: UploadFiles;
  modifyPictureList: UploadFiles;
  otherPictureList: UploadFiles;
}

interface Props {
  caseId?: number | string;
  caseInfo: CaseApi.CaseForm;
  isLog?: boolean;
  pictureList?: Record<string, string>;
}

const props = defineProps<Props>();
const caseInfoRef = ref<FormInstance>();

const caseData = ref(props.caseInfo);
const planName = ref('');

const getGroupDetail = async (id: number | string, customerId: number) => {
  if (!id) return;
  const { list } = await PlanListApi(
    {
      customerId,
      validTag: 1,
      status: 1,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  const plan = list.find((item) => item.id === id);
  planName.value = plan?.insureSn;
};

const showLink = (index: any) => {
  console.error(index);
};

const linkIndex = ref(0);
const changeLink = (index: number) => {
  linkIndex.value = index;
};

const uploadForm = reactive<UploadForm>({
  addressPictureList: [],
  orderPictureList: [],
  accidentPictureList: [],
  cardPictureList: [],
  diseasePictureList: [],
  ticketPictureList: [],
  goodPictureList: [],
  modifyPictureList: [],
  otherPictureList: [],
});

const uploadListData = ref<{ list: UploadFiles; name: string }[]>([]);

watch(
  () => caseData.value.bxbm,
  (newData) => {
    if (!newData) return;
    getGroupDetail(Number(newData), Number(caseData.value.companyId!));
  },
  { immediate: true },
);

watch(
  () => props.pictureList,
  (newData) => {
    if (!newData) return;

    uploadForm.addressPictureList = newData.addressPicture
      ? JSON.parse(newData.addressPicture)
      : [];
    uploadForm.orderPictureList = newData.orderPicture
      ? JSON.parse(newData.orderPicture)
      : [];
    uploadForm.accidentPictureList = newData.accidentPicture
      ? JSON.parse(newData.accidentPicture)
      : [];
    uploadForm.cardPictureList = newData.cardPicture
      ? JSON.parse(newData.cardPicture)
      : [];
    uploadForm.diseasePictureList = newData.diseasePicture
      ? JSON.parse(newData.diseasePicture)
      : [];
    uploadForm.ticketPictureList = newData.ticketPicture
      ? JSON.parse(newData.ticketPicture)
      : [];
    uploadForm.goodPictureList = newData.goodPicture
      ? JSON.parse(newData.goodPicture)
      : [];
    uploadForm.modifyPictureList = newData.modifyPicture
      ? JSON.parse(newData.modifyPicture)
      : [];
    uploadForm.otherPictureList = newData.otherPicture
      ? JSON.parse(newData.otherPicture)
      : [];

    uploadListData.value = [
      {
        name: '现场照片',
        list: uploadForm.addressPictureList,
      },
      {
        name: '订单截图',
        list: uploadForm.orderPictureList,
      },
      {
        name: '事故认定书',
        list: uploadForm.accidentPictureList,
      },
      {
        name: '身份证',
        list: uploadForm.cardPictureList,
      },
      {
        name: '病历资料',
        list: uploadForm.diseasePictureList,
      },
      {
        name: '医疗发票',
        list: uploadForm.ticketPictureList,
      },
      {
        name: '物损照片',
        list: uploadForm.goodPictureList,
      },
      {
        name: '维修发票',
        list: uploadForm.modifyPictureList,
      },
      {
        name: '其他补充',
        list: uploadForm.otherPictureList,
      },
    ];
  },
  { immediate: true },
);
</script>

<template>
  <ElForm
    ref="caseInfoRef"
    :model="caseInfo"
    class="demo-caseInfo"
    label-position="top"
    label-width="auto"
    status-icon
  >
    <ElRow :gutter="20" class="w-full">
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="案件编号：">
          {{ caseData.id }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="创建时间：">
          {{ formatTimestamp(caseData.created!) }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="出险时间：">
          {{ formatTimestamp(caseData.insureTime!) }}
        </ElFormItem>
      </ElCol>
      <ElDivider class="!mt-0" />
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="骑手姓名：">
          {{ caseData.name }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="身份证号：">
          {{ caseData.creditcard }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="手机号：">
          {{ caseData.phone }}
        </ElFormItem>
      </ElCol>
      <ElDivider class="!mt-0" />
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="保险编码：">
          {{ planName }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="有无附加险：">
          {{ caseData.fujiaxian === '1' ? '有' : '无' }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="赔偿对象：">
          {{
            caseData.lipeiPerson === 0
              ? '骑手'
              : caseData.lipeiPerson === 1
                ? '公司'
                : caseData.lipeiPerson === 2
                  ? '三者'
                  : ''
          }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="主险：">
          {{ caseData.insuredMainName }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="主险保单号：">
          {{ caseData.policyNo }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="主险报案号：">
          {{ caseData.casenoInsuredMain }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="附加险：">
          {{ caseData.insuredAttachName }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="附加险保单号：">
          {{ caseData.policyNoAttach }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="附加险报案号：">
          {{ caseData.casenoInsuredAttach }}
        </ElFormItem>
      </ElCol>
      <ElDivider class="!mt-0" />
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="归属站点：">
          {{ caseData.stopName }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="所属客户：">
          {{ caseData.companyName }}
        </ElFormItem>
      </ElCol>
      <ElCol :lg="8" :sm="12">
        <ElFormItem label="站长姓名（手机号）：">
          {{ caseData.stopOwnerName }}({{ caseData.stopOwnerPhone }})
        </ElFormItem>
      </ElCol>
      <template v-if="!isLog">
        <ElDivider class="!mt-0" />
        <ElCol :lg="8" :sm="12">
          <ElFormItem label="责任判定：">
            {{
              caseData.zeren === 1
                ? '全责'
                : caseData.zeren === 2
                  ? '主责'
                  : caseData.zeren === 3
                    ? '次责'
                    : caseData.zeren === 4
                      ? '同责'
                      : caseData.zeren === 5
                        ? '无责'
                        : caseData.zeren === 6
                          ? '摔伤'
                          : ''
            }}
          </ElFormItem>
        </ElCol>
        <ElCol :lg="8" :sm="12">
          <ElFormItem label="出险类型：">
            {{
              caseData.insureType === 1
                ? '自身受伤'
                : caseData.insureType === 2
                  ? '三者受伤'
                  : '三者物损'
            }}
          </ElFormItem>
        </ElCol>
        <ElCol :lg="8" :sm="12">
          <ElFormItem label="创建人：">
            {{ caseData.username }}
          </ElFormItem>
        </ElCol>
        <ElCol :lg="8" :sm="12">
          <ElFormItem label="事故区域：">
            {{ caseData.province }} / {{ caseData.city }} /
            {{ caseData.district }}
          </ElFormItem>
        </ElCol>
        <ElCol :lg="16" :sm="24">
          <ElFormItem label="事故详细地址：">
            {{ caseData.address }}
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem label="事故经过：">
            {{ caseData.details }}
          </ElFormItem>
        </ElCol>
        <ElDivider class="!mt-0" />
        <template v-for="(item, index) in uploadListData" :key="index">
          <ElCol v-if="item.list.length > 0" :span="24">
            <ElFormItem :label="`${item.name}：`">
              <ElImage
                v-for="(img, i) in item.list"
                :key="i"
                :initial-index="i"
                :max-scale="7"
                :min-scale="0.2"
                :preview-src-list="
                  item.list
                    .map((img) => img.url)
                    .filter((url): url is string => !!url)
                "
                :src="img.url"
                :zoom-rate="1.2"
                class="mb-2 mr-2 rounded"
                fit="cover"
                style="width: 100px; height: 100px"
                @show="linkIndex = i"
                @switch="changeLink"
              >
                <template #viewer>
                  <div class="viewerDownload" title="点击下载">
                    <ElLink
                      :underline="false"
                      style="color: rgb(228 228 231)"
                      @click="showLink(linkIndex)"
                    >
                      <ElIcon size="24"><AntDownloadOutlined /></ElIcon>
                    </ElLink>
                  </div>
                </template>
              </ElImage>
            </ElFormItem>
          </ElCol>
        </template>
      </template>
    </ElRow>
  </ElForm>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}

:deep(.el-image-viewer__actions) {
  padding: 0 58px 0 23px !important;
}

.viewerDownload {
  position: absolute;
  right: calc(50vw - 140px);
  bottom: 40px;
  z-index: 1;
  height: 24px;
  line-height: 1;
  color: #fff;
  cursor: pointer;
}
</style>
