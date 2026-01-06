<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElRow,
} from 'element-plus';

import DraggableUploadList from '../components/DraggableUploadList.vue';

defineEmits(['success']);

const CircleClose = createIconifyIcon('ant-design:close-circle-outlined');

// 1. Rider & Reporter Info
const riderForm = reactive({
  riderName: '',
  riderId: '',
  riderPhone: '',
  isManualReport: false,
  reporterIsRider: false,
  reporterName: '',
  reporterPhone: '',
  reporterId: '',
  riderPhone2: '',
});

function handleUpdateRider() {
  ElMessage.success('骑手基本信息/报案人信息 更新成功');
}

// 2. Insurance Info
const insuranceForm = reactive({
  mainPolicyNo: '',
  companyName: '',
  mainPlan: '',
  mainCustomer: '',
  mainChannel: '',
  holderName: '',
  holderIdType: '',
  holderIdNo: '',
  insuredName: '',
  insuredIdType: '',
  insuredIdNo: '',

  attachPolicyNo: '',
  attachCompanyName: '',
  attachPlan: '',
  attachCustomer: '',
  attachChannel: '',
  attachHolderName: '',
  attachHolderIdType: '',
  attachHolderIdNo: '',
  attachInsuredName: '',
  attachInsuredIdType: '',
  attachInsuredIdNo: '',

  stationName: '',
  stationMaster: '',
  stationMasterPhone: '',
});

function handleUpdateInsurance() {
  ElMessage.success('保险信息（保单和订单信息） 更新成功');
}

// 3. Accident Description & Third Party
const accidentForm = reactive({
  description: '',
  area: '', // city+detail
  time: '',
});

const thirdParties = ref([{ name: '', phone: '' }]);

function addThirdParty() {
  thirdParties.value.push({ name: '', phone: '' });
}

function removeThirdParty(index: number) {
  thirdParties.value.splice(index, 1);
}

function handleUpdateAccident() {
  ElMessage.success('事故描述信息/三者信息 更新成功');
}

// 4. File Upload
const fileList = ref<Record<string, any>>({});

const [Modal, modalApi] = useVbenModal({
  title: '更新案件基本信息',
  fullscreen: true,
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      if (data?.caseId) {
        id.value = data.caseId;
      }
      if (data?.caseData) {
        const cd = data.caseData;
        // Section 1: Rider
        riderForm.riderName = cd.name || '';
        riderForm.riderId = cd.creditcard || '';
        riderForm.riderPhone = cd.phone || '';
        riderForm.riderPhone2 = cd.phoneOwner || '';

        // Section 2: Insurance
        insuranceForm.mainPolicyNo = cd.policyNo || '';
        insuranceForm.companyName = cd.companyName || '';
        insuranceForm.mainPlan = cd.insuredMainName || '';
        // Mapping back what we can (some fields like customer/channel might not exist in caseForm directly or need specific mapping)
        insuranceForm.holderName = cd.applicantName || ''; // Assuming mapping
        insuranceForm.holderIdType = cd.applicantIdType || '';
        insuranceForm.holderIdNo = cd.applicantIdNo || '';
        insuranceForm.insuredName = cd.name || '';
        insuranceForm.insuredIdType = cd.idType || '';
        insuranceForm.insuredIdNo = cd.creditcard || '';

        insuranceForm.attachPolicyNo = cd.policyNoAttach || '';
        insuranceForm.attachPlan = cd.insuredAttachName || '';
        insuranceForm.attachInsuredName = cd.name || '';
        insuranceForm.attachInsuredIdNo = cd.creditcard || '';

        insuranceForm.stationName = cd.stopName || '';
        insuranceForm.stationMaster = cd.stopOwnerName || '';
        insuranceForm.stationMasterPhone = cd.stopOwnerPhone || '';

        // Section 3: Accident
        accidentForm.description = cd.details || '';
        accidentForm.area =
          (cd.province || '') +
          (cd.city || '') +
          (cd.district || '') +
          (cd.address || ''); // Simplified backfill
        accidentForm.time = cd.insureTime || '';

        // Section 4: Files (already handled via watch on uploadData/id if passed)
        fileList.value = {
          accidentPicture: cd.accidentPicture,
          addressPicture: cd.addressPicture,
          cardPicture: cd.cardPicture,
          diseasePicture: cd.diseasePicture,
          goodPicture: cd.goodPicture,
          modifyPicture: cd.modifyPicture,
          orderPicture: cd.orderPicture,
          otherPicture: cd.otherPicture,
          ticketPicture: cd.ticketPicture,
        };
      }
    }
  },
});

const id = ref('');
</script>

<template>
  <Modal>
    <div class="min-h-screen space-y-6 bg-gray-50 p-4">
      <!-- Section 1: Rider Basic Info -->
      <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800"
        >
          骑手基本信息
        </div>

        <ElForm :model="riderForm" label-position="left" label-width="auto">
          <ElRow :gutter="24">
            <ElCol :xs="24" :sm="12" :md="8">
              <ElFormItem label="骑手姓名" required>
                <ElInput
                  v-model="riderForm.riderName"
                  placeholder="请输入骑手姓名"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="8">
              <ElFormItem label="骑手身份证号" required>
                <ElInput
                  v-model="riderForm.riderId"
                  placeholder="请输入身份证号"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="8">
              <ElFormItem label="骑手手机号" required>
                <ElInput
                  v-model="riderForm.riderPhone"
                  placeholder="请输入手机号"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <div class="my-4 border-t border-dashed border-gray-200 pt-4">
            <div
              class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
            >
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="riderForm.reporterIsRider"
                  class="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700"
                  >报案人同骑手本人信息</span
                >
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="riderForm.isManualReport"
                  class="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700"
                  >是否手动填写报案</span
                >
              </div>
            </div>

            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="报案人姓名">
                  <ElInput
                    v-model="riderForm.reporterName"
                    :disabled="riderForm.reporterIsRider"
                    placeholder="报案人姓名"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="报案人手机号">
                  <ElInput
                    v-model="riderForm.reporterPhone"
                    :disabled="riderForm.reporterIsRider"
                    placeholder="报案人手机号"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="报案人身份证号">
                  <ElInput
                    v-model="riderForm.reporterId"
                    :disabled="riderForm.reporterIsRider"
                    placeholder="报案人身份证号"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="骑手手机号(不同)">
                  <ElInput
                    v-model="riderForm.riderPhone2"
                    placeholder="骑手手机号"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <div class="mt-4 flex justify-end">
            <ElButton type="primary" plain @click="handleUpdateRider">
              更新
            </ElButton>
          </div>
        </ElForm>
      </div>

      <!-- Section 2: Insurance Info -->
      <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800"
        >
          保险信息
        </div>

        <ElForm :model="insuranceForm" label-position="left" label-width="auto">
          <!-- Main Insurance -->
          <div class="mb-4">
            <div class="mb-4 flex items-center border-b border-gray-200 pb-2">
              <div class="mr-2 h-4 w-1 bg-blue-500"></div>
              <h3 class="text-lg font-bold text-gray-800">主险信息</h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="主险保单号">
                  <ElInput v-model="insuranceForm.mainPolicyNo" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="保险公司名称" required>
                  <ElInput v-model="insuranceForm.companyName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="主险方案" required>
                  <ElInput v-model="insuranceForm.mainPlan" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="所属客户名">
                  <ElInput v-model="insuranceForm.mainCustomer" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="所属渠道名">
                  <ElInput v-model="insuranceForm.mainChannel" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人名称" required>
                  <ElInput v-model="insuranceForm.holderName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件类型" required>
                  <ElInput v-model="insuranceForm.holderIdType" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件编号" required>
                  <ElInput v-model="insuranceForm.holderIdNo" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人名称" required>
                  <ElInput v-model="insuranceForm.insuredName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件类型" required>
                  <ElInput v-model="insuranceForm.insuredIdType" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件号" required>
                  <ElInput v-model="insuranceForm.insuredIdNo" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <!-- Additional Insurance -->
          <div class="mb-4">
            <div class="mb-4 flex items-center border-b border-gray-200 pb-2">
              <div class="mr-2 h-4 w-1 bg-green-500"></div>
              <h3 class="text-lg font-bold text-gray-800">附加险信息</h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="附加险保单号">
                  <ElInput v-model="insuranceForm.attachPolicyNo" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="保险公司名称">
                  <ElInput v-model="insuranceForm.attachCompanyName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="附加险方案">
                  <ElInput v-model="insuranceForm.attachPlan" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="所属客户名">
                  <ElInput v-model="insuranceForm.attachCustomer" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="所属渠道名">
                  <ElInput v-model="insuranceForm.attachChannel" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人名称">
                  <ElInput v-model="insuranceForm.attachHolderName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件类型">
                  <ElInput v-model="insuranceForm.attachHolderIdType" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="投保人证件编号">
                  <ElInput v-model="insuranceForm.attachHolderIdNo" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人名称" required>
                  <ElInput v-model="insuranceForm.attachInsuredName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件类型">
                  <ElInput v-model="insuranceForm.attachInsuredIdType" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="被保人证件号" required>
                  <ElInput v-model="insuranceForm.attachInsuredIdNo" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <!-- Station Info -->
          <div class="mb-4">
            <div class="mb-4 flex items-center border-b border-gray-200 pb-2">
              <div class="mr-2 h-4 w-1 bg-yellow-500"></div>
              <h3 class="text-lg font-bold text-gray-800">站点信息</h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="站点名称">
                  <ElInput v-model="insuranceForm.stationName" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="站长姓名" required>
                  <ElInput v-model="insuranceForm.stationMaster" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12" :md="8">
                <ElFormItem label="站长手机号" required>
                  <ElInput v-model="insuranceForm.stationMasterPhone" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <div class="mt-4 flex justify-end">
            <ElButton type="primary" plain @click="handleUpdateInsurance">
              更新
            </ElButton>
          </div>
        </ElForm>
      </div>

      <!-- Section 3: Accident & Third Party -->
      <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800"
        >
          出险信息
        </div>

        <ElForm :model="accidentForm" label-position="left" label-width="auto">
          <!-- Details Info -->
          <div class="mb-4">
            <div class="mb-4 flex items-center border-b border-gray-200 pb-2">
              <div class="mr-2 h-4 w-1 bg-purple-500"></div>
              <h3 class="text-lg font-bold text-gray-800">详细信息</h3>
            </div>
            <ElRow :gutter="24">
              <ElCol :span="24">
                <ElFormItem label="出险事故详细描述" required>
                  <ElInput
                    type="textarea"
                    :rows="3"
                    v-model="accidentForm.description"
                    placeholder="请输入事故经过、原因、损失情况等详细描述..."
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="事故区域" required>
                  <ElInput
                    v-model="accidentForm.area"
                    placeholder="选省市县+详细地址"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="事故时间" required>
                  <ElDatePicker
                    v-model="accidentForm.time"
                    type="datetime"
                    placeholder="精确到分"
                    class="!w-full"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>

          <!-- Third Party Info -->
          <div class="mb-4">
            <div class="mb-4 flex items-center border-b border-gray-200 pb-2">
              <div class="mr-2 h-4 w-1 bg-indigo-500"></div>
              <h3 class="text-lg font-bold text-gray-800">三者信息</h3>
            </div>

            <div
              v-for="(tp, idx) in thirdParties"
              :key="idx"
              class="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-shadow hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <div class="whitespace-nowrap font-bold text-gray-700">
                  三者{{ idx + 1 }}
                </div>
                <ElFormItem
                  label="姓名"
                  label-width="50px"
                  class="!mb-0 flex-1"
                >
                  <ElInput v-model="tp.name" placeholder="请输入" />
                </ElFormItem>
                <ElFormItem
                  label="手机号"
                  label-width="60px"
                  class="!mb-0 flex-1"
                >
                  <ElInput v-model="tp.phone" placeholder="请输入" />
                </ElFormItem>
                <div
                  v-if="thirdParties.length > 1"
                  class="flex-shrink-0 cursor-pointer text-gray-400 hover:text-red-500"
                  @click="removeThirdParty(idx)"
                >
                  <ElIcon :size="20"><CircleClose /></ElIcon>
                </div>
              </div>
            </div>

            <ElButton
              plain
              class="!w-full !border-dashed !border-indigo-300 !text-indigo-500 hover:!border-indigo-500 hover:!text-indigo-600"
              @click="addThirdParty"
            >
              + 添加事故三者信息
            </ElButton>
          </div>

          <div class="mt-4 flex justify-end">
            <ElButton type="primary" plain @click="handleUpdateAccident">
              更新
            </ElButton>
          </div>
        </ElForm>
      </div>

      <!-- Section 4: File Upload -->
      <div class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div
          class="mb-4 border-l-4 border-blue-500 pl-3 font-bold text-gray-800"
        >
          更新图像文件信息
        </div>

        <DraggableUploadList :id="id" :upload-data="fileList" />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
