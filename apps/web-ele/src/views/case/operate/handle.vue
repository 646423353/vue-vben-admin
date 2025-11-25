<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CaseApi } from '#/api/core/case';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { useWindowSize } from '@vueuse/core';
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
  ElScrollbar,
  ElSelect,
} from 'element-plus';
import moment from 'moment';

import { CaseCommentAddApi, CaseGetApi } from '#/api/core/case';
import { useCaseStore } from '#/store/case';

import CaseCommLog from '../components/CaseCommLog.vue';
import CaseInfo from '../components/CaseInfo.vue';
import UploadList from '../components/UploadList.vue';

const uploadListRef = ref<any>(null);

const caseForm = reactive<CaseApi.CaseForm>({
  accidentPicture: '',
  address: '',
  addressPicture: '',
  bxbm: '',
  cardPicture: '',
  casenoInsuredAttach: '',
  casenoInsuredMain: '',
  city: '',
  cityCode: '',
  companyId: '',
  companyName: '',
  creditcard: '',
  details: '',
  diseasePicture: '',
  district: '',
  districtCode: '',
  fujiaxian: '',
  goodPicture: '',
  insureTime: '',
  insureType: '',
  insuredAttach: '',
  insuredAttachName: '',
  insuredMain: '',
  insuredMainName: '',
  modifyPicture: '',
  name: '',
  orderPicture: '',
  oritext: '',
  otherPicture: '',
  owner: '',
  phone: '',
  phoneOwner: '',
  policyNo: '',
  policyNoAttach: '',
  province: '',
  provinceCode: '',
  stopId: '',
  stopName: '',
  stopOwner: '',
  stopOwnerName: '',
  stopOwnerPhone: '',
  ticketPicture: '',
  zeren: '',
  lipeiPerson: '',
});

const commentFormRef = ref<FormInstance>();
const commentForm = reactive<CaseApi.CommentInfo>({
  beizhu: '',
  caseId: '',
  content: '',
  lipeiPerson: '',
  moneyAttach: '',
  moneyDianfu: '',
  moneyMain: '',
  status: '',
  timeContactNext: '',
  wayContact: '2',
  zeren: '',
  accidentPicture: '',
  addressPicture: '',
  cardPicture: '',
  diseasePicture: '',
  modifyPicture: '',
  orderPicture: '',
  ticketPicture: '',
  otherPicture: '',
  goodPicture: '',
});

const formatMoney = (rule: any, value: string, callback: any) => {
  if (!value) callback();

  if (value && !/^\d+(?:\.\d{1,2})?$/.test(value)) {
    callback(new Error('请输入正确的金额'));
  } else {
    callback();
  }
};
const rules = reactive<FormRules<CaseApi.CommentInfo>>({
  moneyMain: [{ validator: formatMoney, trigger: 'blur' }],
  moneyAttach: [{ validator: formatMoney, trigger: 'blur' }],
  moneyDianfu: [{ validator: formatMoney, trigger: 'blur' }],
});

const router = useRouter();
const route = useRoute();

const { closeCurrentTab } = useTabs();
const id = ref<string>('');
const caseCommLogRef = ref<any>(null);
const caseInfoRef = ref<any>(null);

const back = () => {
  closeCurrentTab();
  router.back();
};
const pictureListForm = ref<any>(null);
const commentPictureList = ref<any>(null);

commentPictureList.value = {
  accidentPicture: '',
  addressPicture: '',
  cardPicture: '',
  diseasePicture: '',
  goodPicture: '',
  modifyPicture: '',
  orderPicture: '',
  otherPicture: '',
  ticketPicture: '',
};

const getCaseDetail = async (id: number | string) => {
  const {
    address,
    bxbm,
    casenoInsuredAttach,
    casenoInsuredMain,
    city,
    cityCode,
    companyId,
    companyName,
    creditcard,
    details,
    district,
    districtCode,
    fujiaxian,
    insureTime,
    insureType,
    insuredAttach,
    insuredAttachName,
    insuredMain,
    insuredMainName,
    name,
    owner,
    phone,
    phoneOwner,
    policyNo,
    policyNoAttach,
    province,
    provinceCode,
    stopId,
    stopName,
    stopOwner,
    stopOwnerName,
    stopOwnerPhone,
    zeren,
    accidentPicture,
    addressPicture,
    cardPicture,
    diseasePicture,
    goodPicture,
    modifyPicture,
    orderPicture,
    otherPicture,
    ticketPicture,
    created,
    username,
    usernameOwner,
    status,
    lipeiPerson,
    moneyAttach,
    moneyDianfu,
    moneyMain,
  } = await CaseGetApi(id);

  caseForm.address = address!;
  caseForm.bxbm = bxbm ? Number(bxbm) : '';
  caseForm.casenoInsuredAttach = casenoInsuredAttach!;
  caseForm.casenoInsuredMain = casenoInsuredMain!;
  caseForm.city = city!;
  caseForm.cityCode = cityCode!;
  caseForm.companyId = companyId!;
  caseForm.companyName = companyName!;
  caseForm.creditcard = creditcard!;
  caseForm.details = details!;
  caseForm.district = district!;
  caseForm.districtCode = districtCode!;
  caseForm.fujiaxian = fujiaxian!;
  caseForm.insureTime = insureTime!;
  caseForm.insureType = insureType!;
  caseForm.insuredAttach = insuredAttach ? Number(insuredAttach) : '';
  caseForm.insuredAttachName = insuredAttachName!;
  caseForm.insuredMain = insuredMain ? Number(insuredMain) : '';
  caseForm.insuredMainName = insuredMainName!;
  caseForm.name = name!;
  caseForm.owner = owner ? Number(owner) : '';
  caseForm.phone = phone!;
  caseForm.phoneOwner = phoneOwner!;
  caseForm.policyNo = policyNo!;
  caseForm.policyNoAttach = policyNoAttach!;
  caseForm.province = province!;
  caseForm.provinceCode = provinceCode!;
  caseForm.stopId = stopId ? Number(stopId) : '';
  caseForm.stopName = stopName!;
  caseForm.stopOwner = stopOwner!;
  caseForm.stopOwnerName = stopOwnerName!;
  caseForm.stopOwnerPhone = stopOwnerPhone!;
  caseForm.zeren = zeren!;
  caseForm.accidentPicture = accidentPicture!;
  caseForm.addressPicture = addressPicture!;
  caseForm.cardPicture = cardPicture!;
  caseForm.diseasePicture = diseasePicture!;
  caseForm.goodPicture = goodPicture!;
  caseForm.modifyPicture = modifyPicture!;
  caseForm.orderPicture = orderPicture!;
  caseForm.otherPicture = otherPicture!;
  caseForm.ticketPicture = ticketPicture!;
  caseForm.created = created!;
  caseForm.username = username!;
  caseForm.lipeiPerson = lipeiPerson!;
  caseForm.id = id;
  caseForm.usernameOwner = usernameOwner!;
  pictureListForm.value = {
    accidentPicture,
    addressPicture,
    cardPicture,
    diseasePicture,
    goodPicture,
    modifyPicture,
    orderPicture,
    otherPicture,
    ticketPicture,
  };
  commentForm.status = status!;
  commentForm.caseId = id;
  commentForm.lipeiPerson = lipeiPerson!;
  commentForm.moneyAttach = moneyAttach!;
  commentForm.moneyDianfu = moneyDianfu!;
  commentForm.moneyMain = moneyMain!;
  commentForm.zeren = zeren!;
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const store = useCaseStore();
const loading = ref<boolean>(false);

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      commentForm.timeContactNext = moment(
        commentForm.timeContactNext,
      ).valueOf();
      const uploadListData = uploadListRef.value.getData(true);
      for (const item in pictureListForm.value) {
        if (typeof pictureListForm.value[item] === 'string')
          pictureListForm.value[item] = JSON.parse(pictureListForm.value[item]);
        pictureListForm.value[item].push(...uploadListData[item]);
        pictureListForm.value[item] = JSON.stringify(
          pictureListForm.value[item],
        );
      }

      try {
        loading.value = true;
        const result = await CaseCommentAddApi({
          ...commentForm,
          ...pictureListForm.value,
        });
        ElMessage.success(`${result}`);
        store.changeCaseStatus(true);
        back();
        resetForm(formEl);
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    } else {
      console.error('error submit!', fields);
    }
  });
};

const { height } = useWindowSize();

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getCaseDetail(id.value);
  }
});
</script>

<template>
  <Page title="案件详情">
    <ElRow :gutter="20">
      <ElCol :lg="12" class="mb-4">
        <ElCard class="h-full">
          <template #header>
            <div class="flex justify-between">
              <span>案件详情</span>
              <span>
                {{ caseForm.usernameOwner }} ({{ caseForm.phoneOwner }})
              </span>
            </div>
          </template>

          <ElScrollbar
            :max-height="`${height - 340 < 500 ? 500 : height - 340}px`"
          >
            <CaseInfo
              ref="caseInfoRef"
              :case-id="id"
              :case-info="caseForm"
              :picture-list="pictureListForm"
            />
          </ElScrollbar>
        </ElCard>
      </ElCol>
      <ElCol :lg="12" class="mb-4">
        <ElCard class="h-full">
          <template #header>
            <div class="card-header">
              <span>沟通动态</span>
            </div>
          </template>

          <ElScrollbar
            :max-height="`${height - 340 < 500 ? 500 : height - 340}px`"
          >
            <CaseCommLog ref="caseCommLogRef" :case-id="id" :is-handle="true" />

            <ElForm
              ref="commentFormRef"
              :model="commentForm"
              :rules="rules"
              class="demo-caseForm mt-12"
              label-width="auto"
              status-icon
            >
              <ElRow :gutter="20" class="w-full">
                <ElCol :lg="12">
                  <ElFormItem label="赔偿对象">
                    <ElSelect
                      v-model="commentForm.lipeiPerson"
                      placeholder="请选择"
                    >
                      <ElOption :value="0" label="骑手" />
                      <ElOption :value="1" label="公司" />
                      <ElOption :value="2" label="三者" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="责任判定">
                    <ElRadioGroup v-model="commentForm.zeren">
                      <ElRadioButton :value="1" label="全责" />
                      <ElRadioButton :value="2" label="主责" />
                      <ElRadioButton :value="3" label="次责" />
                      <ElRadioButton :value="4" label="同责" />
                      <ElRadioButton :value="5" label="无责" />
                      <ElRadioButton :value="6" label="摔伤" />
                    </ElRadioGroup>
                    <ElButton
                      class="ml-4"
                      type="primary"
                      @click="commentForm.zeren = ''"
                    >
                      重置
                    </ElButton>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="主险赔付金额" prop="moneyMain">
                    <ElInput
                      v-model="commentForm.moneyMain"
                      placeholder="请输入"
                      type="number"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="附加险赔付金额" prop="moneryAttach">
                    <ElInput
                      v-model="commentForm.moneyAttach"
                      placeholder="请输入"
                      type="number"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="垫付金额" prop="moneyDianfu">
                    <ElInput
                      v-model="commentForm.moneyDianfu"
                      placeholder="请输入"
                      type="number"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="沟通方式">
                    <ElSelect
                      v-model="commentForm.wayContact"
                      placeholder="请选择"
                    >
                      <ElOption label="其他" value="1" />
                      <ElOption label="微信" value="2" />
                      <ElOption label="电话" value="3" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="下次沟通时间">
                    <ElDatePicker
                      v-model="commentForm.timeContactNext"
                      placeholder="请选择"
                      type="date"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :lg="12">
                  <ElFormItem label="案件状态">
                    <ElSelect v-model="commentForm.status" placeholder="请选择">
                      <ElOption :value="0" label="注销" />
                      <ElOption :value="1" label="结案" />
                      <ElOption :value="2" label="理赔待处理" />
                      <ElOption :value="3" label="保险公司定损" />
                      <ElOption :value="4" label="待诉讼" />
                      <ElOption :value="5" label="诉讼" />
                      <ElOption :value="6" label="协议文件" />
                      <ElOption :value="7" label="公司盖章" />
                      <ElOption :value="8" label="待打款" />
                      <ElOption :value="9" label="资料收集" />
                      <ElOption :value="10" label="待骑手提供资料" />
                      <ElOption :value="11" label="劳动仲裁" />
                      <ElOption :value="12" label="死亡案件" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="沟通内容">
                    <ElInput
                      v-model="commentForm.content"
                      :autosize="{ minRows: 4 }"
                      placeholder="请输入"
                      type="textarea"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="案件备注">
                    <ElInput
                      v-model="commentForm.beizhu"
                      :autosize="{ minRows: 4 }"
                      placeholder="请输入"
                      type="textarea"
                    />
                  </ElFormItem>
                </ElCol>

                <UploadList
                  :id="id"
                  ref="uploadListRef"
                  :upload-data="commentPictureList"
                />
              </ElRow>
            </ElForm>
          </ElScrollbar>
        </ElCard>
      </ElCol>
    </ElRow>

    <div class="flex w-full justify-end">
      <ElButton type="primary" @click="submitForm(commentFormRef)">
        提交
      </ElButton>
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

:deep(.el-form-item--label-top .el-form-item__label) {
  font-weight: 600;
}
</style>
