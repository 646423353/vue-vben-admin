<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { ElButton, ElCard, ElCol, ElRow, ElScrollbar } from 'element-plus';

import { type CaseApi, CaseGetApi } from '#/api/core/case';

import CaseCommLog from '../components/CaseCommLog.vue';
import CaseInfo from '../components/CaseInfo.vue';

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
    lipeiPerson,
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
};

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

          <ElScrollbar max-height="calc(100vh - 340px)">
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

          <CaseCommLog ref="caseCommLogRef" :case-id="id" />
        </ElCard>
      </ElCol>
    </ElRow>

    <div class="flex w-full justify-end">
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
