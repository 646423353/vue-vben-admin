<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseApi } from '#/api/core/case';

import { reactive, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { CaseGetApi, CaseLogApi } from '#/api/core/case';

import CaseInfo from './CaseInfo.vue';

interface LogEntry {
  caseId?: string; // 案件id，可选
  caseInfo?: CaseApi.CaseDetail; // 案件信息，可选，假设TbCaseWithBLOBs是已定义的类型
  content?: string; // 日志内容，可选
  created?: string; // 创建时间，可选
  id?: number; // 标识符，可选，注意这里使用number而不是integer
  photo?: string; // 照片，可选
  reason?: string; // 重开理由，可选
  reopenTag?: number; // 重开标记，1表示重开，0表示不属于重开，可选
  uid?: string; // 用户ID，可选
  username?: string; // 用户名，可选
}

const id = ref<string>('');
const caseInfoRef = ref<any>(null);
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
};

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: uid } = drawerApi.getData<Record<string, any>>();
      id.value = uid;
      getCaseDetail(uid);
    }
  },
  showConfirmButton: false,
  cancelText: '关闭',
});

const gridOptions: VxeGridProps<LogEntry> = {
  columns: [
    {
      field: 'content',
      showOverflow: true,
      title: '日志内容',
      minWidth: 250,
    },
    { field: 'username', title: '操作人', minWidth: 120 },
    {
      title: '创建时间',
      minWidth: 150,
      formatter: ({ row }) =>
        row.created ? moment(row.created).format('YYYY-MM-DD HH:mm:ss') : '',
    },
  ],
  minHeight: 500,
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 30, 50],
  },
  sortConfig: {
    multiple: true,
  },
  align: 'left',
  stripe: true,
  border: true,
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async ({ page }) => {
        return await CaseLogApi(id.value, page.currentPage, page.pageSize);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  gridApi.setGridOptions({
    maxHeight: height.value - 800,
  });
}
resize();
</script>
<template>
  <Drawer class="w-2/5" title="案件日志">
    <div>
      <CaseInfo
        ref="caseInfoRef"
        :case-id="id"
        :case-info="caseForm"
        :is-log="true"
      />

      <Grid />
    </div>
  </Drawer>
</template>
