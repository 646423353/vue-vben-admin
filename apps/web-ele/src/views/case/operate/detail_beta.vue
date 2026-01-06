<script lang="ts" setup>
import type { CaseApi } from '#/api/core/case';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import {
  AntdEditOutlined,
  ArrowDown,
  ChevronRight,
  createIconifyIcon,
} from '@vben/icons';

import {
  ElButton,
  ElIcon,
  ElStep,
  ElSteps,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { CaseRecordGetApi } from '#/api/core/case-record';

import CaseCommLog from '../components/CaseCommLog_beta.vue';
import CaseImages from '../components/CaseImages.vue';
import CaseInfo from '../components/CaseInfo.vue';
import CaseRiskInfo from '../components/CaseRiskInfo.vue';
import CompensationModal from '../components/CompensationModal.vue';
import DockingModal from '../components/DockingModal.vue';
import InsuranceDockingModal from '../components/InsuranceDockingModal.vue';
import LossAssessmentModal from '../components/LossAssessmentModal.vue';
import NegotiationModal from '../components/NegotiationModal.vue';
import NoteCard from '../components/NoteCard.vue';
import NoteCardActions from '../components/NoteCardActions.vue';
import UpdateAccidentInfoModal from '../components/UpdateAccidentInfoModal.vue';
import ValueAssessmentModal from '../components/ValueAssessmentModal.vue';

const WarningFilled = createIconifyIcon('ep:warning-filled');
const Plus = createIconifyIcon('ep:plus');

// ... (existing code)

const [LossAssessmentModalComponent, lossAssessmentModalApi] = useVbenModal({
  connectedComponent: LossAssessmentModal,
});

function openLossAssessmentModal() {
  lossAssessmentModalApi.open();
}

const [ValueAssessmentModalComponent, valueAssessmentModalApi] = useVbenModal({
  connectedComponent: ValueAssessmentModal,
});

function openValueAssessmentModal() {
  const fields = [
    { key: 'accidentPicture', label: '事故现场照片' },
    { key: 'addressPicture', label: '事故地点照片' },
    { key: 'cardPicture', label: '身份证照片' },
    { key: 'diseasePicture', label: '病历照片' },
    { key: 'goodPicture', label: '物品损失照片' },
    { key: 'modifyPicture', label: '定损通过照片' },
    { key: 'orderPicture', label: '订单截图' },
    { key: 'otherPicture', label: '其他照片' },
    { key: 'ticketPicture', label: '发票照片' },
  ];

  const fileList: Array<{ label: string; value: number | string }> = [];

  if (pictureListForm.value) {
    fields.forEach(({ key, label }) => {
      const val = pictureListForm.value[key];
      if (val) {
        try {
          const list = JSON.parse(val);
          if (Array.isArray(list)) {
            list.forEach((item, index) => {
              // Assuming item has 'url' or is a string. Adjust based on actual data structure.
              // Use URL as value, and Label + Index as label
              const url = typeof item === 'object' ? item.url : item;
              if (url) {
                fileList.push({
                  label: `${label}-${index + 1}`,
                  value: url,
                });
              }
            });
          }
        } catch {
          // If not JSON, treat as single string URL?
          // Based on imageCount logic, it purely parses JSON. We stick to that.
        }
      }
    });
  }

  valueAssessmentModalApi.setData({
    caseId: id.value,
    isRiderUpdated: true,
    isThreeUpdated: true,
    fileList,
  });
  valueAssessmentModalApi.open();
}

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

const route = useRoute();

const id = ref<string>('');
const caseCommLogRef = ref();
const caseInfoRef = ref();
const logCount = ref(0);
const activeTab = ref('detail');
const isExpanded = ref(false);

const pictureListForm = ref<any>(null);

const imageCount = computed(() => {
  if (!pictureListForm.value) return 0;
  let count = 0;
  const fields = [
    'accidentPicture',
    'addressPicture',
    'cardPicture',
    'diseasePicture',
    'goodPicture',
    'modifyPicture',
    'orderPicture',
    'otherPicture',
    'ticketPicture',
  ];
  fields.forEach((field) => {
    const val = pictureListForm.value[field];
    if (val) {
      try {
        const list = JSON.parse(val);
        if (Array.isArray(list)) {
          count += list.length;
        }
      } catch {
        // ignore error
      }
    }
  });
  return count;
});

const steps = [
  { title: '案件待定损' },
  { title: '已有定损表待对接' },
  { title: '已创建保司对接表待提交' },
  { title: '已提交保司待保司反馈' },
  { title: '已有保司反馈待客户确认' },
  { title: '客户协商已完成' },
  { title: '理赔付款已完成' },
];

const getCaseDetail = async (id: number | string) => {
  const res = await CaseRecordGetApi(id);
  if (!res) return;
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
  } = res;

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

  // Mock data for Status and Risk Display
  caseForm.runStatusString = '挂起';
  caseForm.abnormalTag = '异常';
  caseForm.hangUpTag = '无法联系骑手';
  caseForm.totalDuration = '1天12时14分';
  caseForm.totalDurationStatus = '已超时';
  caseForm.riskLogs = [
    '【案件发现Rule1】 AAA定损员 (定损员) 开始于 2025/01/01 21:12:12 操作用时 1天12时14分 (已超时)',
  ];
};

onMounted(async () => {
  id.value = route.query.id as string;

  if (id.value) {
    getCaseDetail(id.value);
  }
});

const [DockingModalComponent, dockingModalApi] = useVbenModal({
  connectedComponent: DockingModal,
});

const [NegotiationModalComponent, negotiationModalApi] = useVbenModal({
  connectedComponent: NegotiationModal,
});

const [CompensationModalComponent, compensationModalApi] = useVbenModal({
  connectedComponent: CompensationModal,
});

const [InsuranceDockingModalComponent, insuranceDockingModalApi] = useVbenModal(
  {
    connectedComponent: InsuranceDockingModal,
  },
);

function openDockingModal() {
  dockingModalApi.setData({ caseId: id.value });
  dockingModalApi.open();
}

function openNegotiationModal() {
  negotiationModalApi.setData({ caseId: id.value });
  negotiationModalApi.open();
}

function openCompensationModal() {
  compensationModalApi.setData({ caseId: id.value });
  compensationModalApi.open();
}

function openInsuranceDockingModal(isEdit = false) {
  const initialData = isEdit
    ? {
        policyNo: caseForm.policyNo,
        companyName: caseForm.companyName,
        adjusterName: caseForm.lipeiPerson,
        adjusterPhone: caseForm.phone,
        adjusterEmail: 'test@example.com', // Mock or add field if available
        dockingType: '主险', // Mock or derive
      }
    : undefined;

  insuranceDockingModalApi.setData({
    caseId: id.value,
    isEdit,
    initialData,
  });
  insuranceDockingModalApi.open();
}

const [UpdateAccidentInfoModalComponent, updateAccidentInfoModalApi] =
  useVbenModal({
    connectedComponent: UpdateAccidentInfoModal,
  });

function openUpdateAccidentModal() {
  updateAccidentInfoModalApi.setData({
    caseId: id.value,
    caseData: { ...caseForm },
  });
  updateAccidentInfoModalApi.open();
}

function handleReloadList() {
  // TODO: Refresh list logic
  if (caseCommLogRef.value) {
    // If we want to refresh logs, assuming the new docking info appears in logs or we need to fetch the docking list
    // For now just a placeholder or maybe refresh the case detail
    getCaseDetail(id.value);
  }
}
</script>

<template>
  <Page :title="`案件详情 ${id}`">
    <div class="mx-auto max-w-7xl p-4">
      <div class="rounded-xl bg-white shadow-sm">
        <ElTabs v-model="activeTab" class="demo-tabs px-6 pt-4">
          <ElTabPane name="detail">
            <template #label>
              <span class="text-base font-medium">基础信息</span>
            </template>
            <div class="relative border-b border-gray-100 pb-8">
              <div
                class="overflow-hidden transition-all duration-300"
                :class="[isExpanded ? 'max-h-[5000px]' : 'max-h-[280px]']"
              >
                <div class="py-4">
                  <CaseInfo
                    ref="caseInfoRef"
                    :case-id="id"
                    :case-info="caseForm"
                    :picture-list="pictureListForm"
                    :show-images="false"
                  />
                </div>
              </div>

              <!-- Expand/Collapse Button -->
              <div
                class="absolute bottom-0 left-0 right-0 flex cursor-pointer justify-center bg-gradient-to-t from-white via-white to-transparent py-4"
                @click="isExpanded = !isExpanded"
              >
                <div
                  class="flex items-center rounded-full bg-blue-50 px-6 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <span class="mr-1">{{
                    isExpanded ? '收起详情' : '展开详情'
                  }}</span>
                  <ElIcon
                    class="transition-transform duration-300"
                    :class="[isExpanded ? 'rotate-180' : '']"
                  >
                    <ArrowDown />
                  </ElIcon>
                </div>
              </div>
            </div>

            <!-- Process Flow Diagram -->
            <div class="mt-6 px-2">
              <!-- Mobile: Vertical Steps -->
              <div class="block md:hidden">
                <ElSteps
                  :active="1"
                  :space="45"
                  direction="vertical"
                  finish-status="success"
                >
                  <ElStep
                    v-for="step in steps"
                    :key="step.title"
                    :title="step.title"
                  />
                </ElSteps>
              </div>

              <!-- Desktop: Horizontal Steps -->
              <div class="hidden overflow-x-auto pb-4 md:block">
                <ElSteps
                  :active="1"
                  align-center
                  class="min-w-[800px]"
                  finish-status="success"
                >
                  <ElStep
                    v-for="step in steps"
                    :key="step.title"
                    :title="step.title"
                  />
                </ElSteps>
              </div>
            </div>

            <!-- Risk Log Alert -->
            <div
              v-if="caseForm.riskLogs && caseForm.riskLogs.length > 0"
              class="mt-4 px-6"
            >
              <div class="rounded-md border border-red-100 bg-red-50 p-3">
                <div
                  v-for="(log, index) in caseForm.riskLogs"
                  :key="index"
                  class="flex items-center text-sm font-bold text-red-600"
                >
                  <ElIcon class="mr-2"><WarningFilled /></ElIcon>
                  {{ log }}
                </div>
              </div>
            </div>

            <!-- Note Card Operation/History Area -->
            <div class="mt-6 space-y-6">
              <!-- 1. History State (Green) -->
              <NoteCard
                status="history"
                theme="green"
                user-name="AAA定损员"
                role-name="定损员"
                start-time="2025/01/01 21:12:12"
                duration="1天12时34分"
                :is-overdue="true"
                submit-time="2025/01/01 21:12:12"
                submit-content="这里显示沟通框写的内容。。。。。。"
              />

              <!-- 2. Operating State (Green) - Empty -->
              <NoteCard
                status="operating"
                theme="green"
                user-name="AAA定损员"
                role-name="定损员"
                start-time="2025/01/01 21:12:12"
                duration="1天12时34分"
                :is-overdue="true"
              >
                <template #actions>
                  <NoteCardActions @update="openUpdateAccidentModal" />
                </template>
              </NoteCard>

              <!-- 3. Operating State (Green) - With Content -->
              <NoteCard
                status="operating"
                theme="green"
                user-name="AAA定损员"
                role-name="定损员"
                start-time="2025/01/01 21:12:12"
                duration="1天12时34分"
                :is-overdue="true"
              >
                <template #content>
                  <div class="space-y-4 px-2 sm:px-4">
                    <!-- Update Info Section -->
                    <div
                      class="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div class="mb-2 text-gray-600">
                        修改骑手姓名为：
                        <span class="font-medium text-gray-900">XXX</span>
                      </div>
                      <div class="mb-2 text-gray-600">
                        修改站点名称为：
                        <span class="font-medium text-gray-900">XXXXX站点</span>
                      </div>
                      <div class="mb-2 text-gray-600">
                        修改出险时间为：
                        <span class="font-medium text-gray-900">
                          2222-22-22 22-22-22
                        </span>
                      </div>
                      <div class="text-gray-600">
                        新增图像文件资料：
                        <span class="font-medium text-gray-900">3个</span>
                      </div>
                      <div class="mt-4 sm:absolute sm:right-5 sm:top-5 sm:mt-0">
                        <ElButton
                          size="small"
                          class="w-full !border-gray-200 !bg-gray-50 shadow-sm hover:!border-blue-300 hover:!text-blue-600 sm:w-auto"
                        >
                          查看更新后完整出险信息
                          <ElIcon class="ml-1"><ChevronRight /></ElIcon>
                        </ElButton>
                      </div>
                    </div>

                    <!-- Loss Table Section -->
                    <div
                      class="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div
                        class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3"
                      >
                        <div
                          class="flex items-center gap-2 font-bold text-gray-800"
                        >
                          <div class="h-4 w-1 rounded bg-green-500"></div>
                          定损表 137-2311243
                        </div>
                        <ElButton
                          size="small"
                          class="!border-gray-200 !bg-gray-50 shadow-sm hover:!border-blue-300 hover:!text-blue-600"
                          @click="openValueAssessmentModal"
                        >
                          修改定损表
                          <ElIcon class="ml-1"><ChevronRight /></ElIcon>
                        </ElButton>
                      </div>
                      <div
                        class="mb-4 flex flex-wrap gap-3 text-sm text-gray-600"
                      >
                        <span
                          class="rounded-md bg-gray-50 px-3 py-1 font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                        >
                          事故类型：交通逆行
                        </span>
                        <span
                          class="rounded-md bg-gray-50 px-3 py-1 font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                        >
                          责任类型：双方责任
                        </span>
                      </div>
                      <div class="mb-4 text-sm leading-relaxed text-gray-500">
                        损失价值计算：三者车辆 1290元 三者人身 200元 骑手车辆
                        0元 骑手人身 800元 其它定义的责任主体 XX元
                      </div>
                      <div
                        class="flex items-center justify-end font-medium text-gray-900"
                      >
                        应赔付总金额：
                        <span class="ml-2 text-xl font-bold text-red-600">
                          8888
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
                <template #actions>
                  <NoteCardActions @update="openUpdateAccidentModal" />
                </template>
              </NoteCard>

              <!-- 4. Operating State (Blue) - Insurance Docking -->
              <NoteCard
                status="operating"
                theme="blue"
                user-name="BB保司对接员"
                role-name="初审与保司对接员"
                start-time="2025/01/01 21:12:12"
                duration="1天12时34分"
                :is-overdue="true"
              >
                <template #content>
                  <div class="space-y-4 px-2 sm:px-4">
                    <!-- Loss Table Section (Inherited) -->
                    <div
                      class="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div
                        class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3"
                      >
                        <div
                          class="flex items-center gap-2 font-bold text-gray-800"
                        >
                          <div class="h-4 w-1 rounded bg-blue-500"></div>
                          定损表 137-2311243
                        </div>
                        <ElButton
                          size="small"
                          class="!border-gray-200 !bg-gray-50 shadow-sm hover:!border-blue-300 hover:!text-blue-600"
                          @click="openLossAssessmentModal"
                        >
                          修改定损表
                          <ElIcon class="ml-1"><ChevronRight /></ElIcon>
                        </ElButton>
                      </div>
                      <div class="mb-4 text-sm text-gray-600">
                        事故判定：双方责任 ... （只取4个判定字段的值）
                      </div>
                      <div class="mb-4 text-sm leading-relaxed text-gray-500">
                        损失价值计算：三者车辆 1290元 三者人身 200元 骑手车辆
                        0元 骑手人身 800元 其它定义的责任主体 XX元
                      </div>
                      <div
                        class="flex items-center justify-end font-medium text-gray-900"
                      >
                        应赔付总金额：
                        <span class="ml-2 text-xl font-bold text-red-600">
                          8888
                        </span>
                      </div>
                    </div>

                    <!-- Insurance Docking Table -->
                    <div
                      class="overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div
                        class="flex flex-col items-start gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
                      >
                        <div class="flex items-center gap-3">
                          <span class="text-base font-bold text-gray-900">
                            保司对接表1 137-01132
                          </span>
                        </div>

                        <div
                          class="flex w-full flex-col gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:px-4"
                        >
                          <div
                            class="flex items-center justify-between sm:justify-start sm:gap-2"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-gray-500">保单号</span>
                              <span class="font-medium text-gray-900">{{
                                caseForm.policyNo || '912839124'
                              }}</span>
                            </div>
                            <span
                              class="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 sm:hidden"
                            >
                              主险
                            </span>
                          </div>

                          <div
                            class="hidden h-3 w-px bg-gray-300 sm:block"
                          ></div>
                          <div class="hidden items-center gap-2 sm:flex">
                            <span
                              class="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600"
                            >
                              主险
                            </span>
                          </div>
                          <div
                            class="hidden h-3 w-px bg-gray-300 sm:block"
                          ></div>

                          <div class="flex items-center gap-2">
                            <span class="text-gray-500">对接人</span>
                            <span class="font-medium text-gray-900">
                              {{
                                caseForm.companyName ||
                                '福建省乐达网络科技有限公司'
                              }}
                              {{ caseForm.lipeiPerson || 'LN 姓名' }}
                            </span>
                          </div>

                          <div
                            class="flex items-center justify-between sm:justify-start sm:gap-4"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-gray-400">{{
                                caseForm.phone || '17337620737'
                              }}</span>
                              <span class="text-gray-400">邮箱</span>
                            </div>
                            <div
                              class="ml-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                              @click.stop="openInsuranceDockingModal(true)"
                            >
                              <ElIcon><AntdEditOutlined /></ElIcon>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="bg-white text-sm">
                        <div
                          class="flex flex-col border-b border-gray-100 last:border-0 hover:bg-gray-50 sm:flex-row"
                        >
                          <div
                            class="w-full border-gray-100 p-3 text-gray-500 sm:w-40 sm:border-r"
                          >
                            2025/01/01 10:00:01
                          </div>
                          <div
                            class="w-full border-gray-100 p-3 font-medium text-gray-700 sm:w-24 sm:border-r"
                          >
                            提交材料
                          </div>
                          <div class="flex-1 p-3 text-gray-800">
                            向平安辽宁分公司XXX理赔员提交了材料
                          </div>
                        </div>
                        <div
                          class="flex flex-col border-b border-gray-100 last:border-0 hover:bg-gray-50 sm:flex-row"
                        >
                          <div
                            class="w-full border-gray-100 p-3 text-gray-500 sm:w-40 sm:border-r"
                          >
                            2025/01/02 11:11:00
                          </div>
                          <div
                            class="w-full border-gray-100 p-3 font-medium text-gray-700 sm:w-24 sm:border-r"
                          >
                            保司反馈
                          </div>
                          <div class="flex-1 p-3 text-gray-800">
                            理赔金额200元
                          </div>
                        </div>
                        <div
                          class="flex flex-wrap gap-4 bg-gray-50 p-3 font-medium text-blue-600"
                        >
                          <span
                            class="cursor-pointer transition-colors hover:text-blue-700 hover:underline"
                            @click="openDockingModal"
                          >
                            <ElIcon class="mr-1"><Plus /></ElIcon> 添加对接
                          </span>
                          <span
                            class="cursor-pointer transition-colors hover:text-blue-700 hover:underline"
                          >
                            <ElIcon class="mr-1"><ChevronRight /></ElIcon>
                            导出报损清单Excel
                          </span>
                          <span
                            class="cursor-pointer transition-colors hover:text-blue-700 hover:underline"
                          >
                            <ElIcon class="mr-1"><ChevronRight /></ElIcon>
                            导出图像材料
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template #actions>
                  <NoteCardActions
                    theme="blue"
                    @update="openUpdateAccidentModal"
                  />
                </template>
              </NoteCard>

              <!-- 5. Negotiation Record & Final Compensation -->
              <NoteCard
                status="operating"
                theme="blue"
                user-name="AAA定损员"
                role-name="定损员"
                start-time="2025/01/01 21:12:12"
                duration="1天12时34分"
                :is-overdue="true"
              >
                <template #content>
                  <div class="space-y-6 px-2 sm:px-4">
                    <!-- Negotiation Record Table -->
                    <div
                      class="overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div
                        class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 p-3"
                      >
                        <div class="flex items-center gap-4">
                          <span class="font-bold text-gray-800">
                            赔付协商记录表1 137-01132
                          </span>
                          <span class="text-sm text-gray-600">
                            主体：骑手/三者1 张三 18800001111
                          </span>
                        </div>
                      </div>
                      <div class="bg-white text-sm">
                        <div
                          class="flex flex-col border-b border-gray-100 last:border-0 hover:bg-gray-50 sm:flex-row"
                        >
                          <div
                            class="w-full border-gray-100 p-3 text-gray-500 sm:w-40 sm:border-r"
                          >
                            2025/01/01 10:00:01
                          </div>
                          <div
                            class="w-full border-gray-100 p-3 font-medium text-gray-700 sm:w-40 sm:border-r"
                          >
                            与骑手/三者1/2/3协商
                          </div>
                          <div class="flex-1 p-3 text-gray-800">
                            向骑手协商一致说明说明说明说明说明说明说明说明
                            <div class="mt-1">
                              <a
                                href="#"
                                class="text-blue-600 hover:underline"
                                @click.prevent
                              >
                                附件1（直接展示文件名）
                              </a>
                            </div>
                          </div>
                        </div>
                        <div
                          class="flex flex-col border-b border-gray-100 last:border-0 hover:bg-gray-50 sm:flex-row"
                        >
                          <div
                            class="w-full border-gray-100 p-3 text-gray-500 sm:w-40 sm:border-r"
                          >
                            2025/01/02 11:11:00
                          </div>
                          <div
                            class="w-full border-gray-100 p-3 font-medium text-gray-700 sm:w-40 sm:border-r"
                          >
                            协商完成
                          </div>
                          <div class="flex-1 p-3 text-gray-800">
                            理赔金额200元
                          </div>
                        </div>
                        <div class="bg-gray-50 p-3">
                          <span
                            class="cursor-pointer font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                            @click="openNegotiationModal"
                          >
                            +添加协商
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Final Compensation Area -->
                    <div
                      class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div
                        class="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3"
                      >
                        <div class="h-4 w-1 rounded bg-purple-500"></div>
                        <span class="font-bold text-gray-800">最终赔付区</span>
                        <span
                          class="ml-2 cursor-pointer text-sm text-blue-600 hover:underline"
                        >
                          +添加
                        </span>
                      </div>

                      <div class="flex flex-wrap items-center gap-6 text-sm">
                        <div class="flex flex-col gap-1">
                          <span class="text-xs text-gray-400">赔付主体</span>
                          <span class="font-medium text-gray-700">--</span>
                        </div>
                        <div class="flex flex-col gap-1">
                          <span class="text-xs text-gray-400">
                            最终赔付金额
                          </span>
                          <span class="font-medium text-gray-700">--</span>
                        </div>
                        <div class="flex flex-col gap-1">
                          <span class="text-xs text-gray-400">
                            收款银行卡户名
                          </span>
                          <span class="font-medium text-gray-700">--</span>
                        </div>
                        <!-- Add more fields as needed with same structure -->

                        <div class="ml-auto flex gap-3 text-blue-600">
                          <span class="cursor-pointer hover:underline">
                            生成理算确认书
                          </span>
                          <span class="cursor-pointer hover:underline">
                            赔付凭证上传
                          </span>
                          <span class="cursor-pointer hover:underline">
                            编辑
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template #actions>
                  <NoteCardActions
                    theme="blue"
                    @update="openUpdateAccidentModal"
                    @add-docking="openInsuranceDockingModal"
                    @add-payment="openCompensationModal"
                  />
                </template>
              </NoteCard>
            </div>
          </ElTabPane>

          <ElTabPane name="log">
            <template #label>
              <span>
                处理日志
                <span class="text-gray-500">{{ logCount }}</span>
              </span>
            </template>
            <CaseCommLog
              ref="caseCommLogRef"
              :case-id="id"
              @update:total="(val) => (logCount = val)"
            />
          </ElTabPane>

          <ElTabPane name="reminder">
            <template #label>
              <span>关联催办 <span class="text-red-500">10</span></span>
            </template>
            <div
              class="flex min-h-[300px] items-center justify-center text-gray-400"
            >
              暂无关联催办
            </div>
          </ElTabPane>

          <ElTabPane name="images">
            <template #label>
              <span>
                图像文件
                <span class="text-gray-500">{{ imageCount }}</span>
              </span>
            </template>
            <div class="p-4">
              <CaseImages :picture-list="pictureListForm" />
            </div>
          </ElTabPane>

          <ElTabPane name="risk">
            <template #label>
              <span>风险预警 <span class="text-red-500">2</span></span>
            </template>
            <div class="px-2 py-4">
              <CaseRiskInfo />
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
      <DockingModalComponent @reload-list="handleReloadList" />
      <NegotiationModalComponent @reload-list="handleReloadList" />
      <CompensationModalComponent @reload-list="handleReloadList" />
      <InsuranceDockingModalComponent @reload-list="handleReloadList" />
      <UpdateAccidentInfoModalComponent />
      <LossAssessmentModalComponent />
      <ValueAssessmentModalComponent />
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
