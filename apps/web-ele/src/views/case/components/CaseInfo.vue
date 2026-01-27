<script lang="ts" setup>
import type { CaseApi } from '#/api/core/case';

import { ref, watch } from 'vue';

import { ElDivider, ElTag } from 'element-plus';

import { PlanListApi } from '#/api/core/plan';
import { formatTimestamp } from '#/utils/dateUtils';

import CaseImages from './CaseImages.vue';

interface Props {
  caseId?: number | string;
  caseInfo: CaseApi.CaseForm;
  isLog?: boolean;
  pictureList?: Record<string, string>;
  fileList?: CaseApi.TbCaseFiles[];
  showImages?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  caseId: '',
  isLog: false,
  pictureList: () => ({}),
  fileList: () => [],
  showImages: true,
});

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
  planName.value = plan?.insureSn || '';
};

watch(
  () => caseData.value.bxbm,
  (newData) => {
    if (!newData) return;
    getGroupDetail(Number(newData), Number(caseData.value.companyId!));
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-8 p-2">
    <!-- Section: Basic Info -->
    <section>
      <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        基本信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">案件编号</span>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-gray-900">{{ caseData.id }}</span>
            <span
              v-if="caseData.runStatusString"
              class="text-xs font-bold text-orange-400"
              >{{ caseData.runStatusString }}</span
            >
            <ElTag
              v-if="caseData.abnormalTag"
              type="danger"
              size="small"
              effect="plain"
              class="!border-red-200 !text-red-600"
              >{{ caseData.abnormalTag }}</ElTag
            >
            <ElTag
              v-if="caseData.hangUpTag"
              type="warning"
              size="small"
              effect="plain"
              class="!border-orange-200 !text-orange-600"
              >{{ caseData.hangUpTag }}</ElTag
            >
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">创建时间</span>
          <span class="font-medium text-gray-900">{{
            formatTimestamp(caseData.created!)
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">出险时间</span>
          <span class="font-medium text-gray-900">{{
            formatTimestamp(caseData.insureTime!)
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">案件总用时</span>
          <span class="font-medium text-gray-900">{{
            caseData.totalDuration || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">案件总用时状态</span>
          <span class="font-medium text-gray-900">{{
            caseData.totalDurationStatus || '-'
          }}</span>
        </div>
      </div>
    </section>

    <ElDivider class="!my-6 border-gray-100" />

    <!-- Section: Person Info -->
    <section>
      <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        人员信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">骑手姓名</span>
          <span class="font-medium text-gray-900">{{ caseData.name }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">身份证号</span>
          <span class="font-medium text-gray-900">{{
            caseData.creditcard
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">手机号</span>
          <span class="font-medium text-gray-900">{{ caseData.phone }}</span>
        </div>
      </div>
    </section>

    <ElDivider class="!my-6 border-gray-100" />

    <!-- Section: Insurance Info -->
    <section>
      <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        保险信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">保险编码</span>
          <span class="font-medium text-gray-900">{{ planName || '-' }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">有无附加险</span>
          <span class="font-medium text-gray-900">{{
            caseData.fujiaxian === '1' ? '有' : '无'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">赔偿对象</span>
          <span class="font-medium text-gray-900">
            {{
              caseData.lipeiPerson === 0
                ? '骑手'
                : caseData.lipeiPerson === 1
                  ? '公司'
                  : caseData.lipeiPerson === 2
                    ? '三者'
                    : '-'
            }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">主险</span>
          <span class="font-medium text-gray-900">{{
            caseData.insuredMainName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">主险保单号</span>
          <span class="font-medium text-gray-900">{{
            caseData.policyNo || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">主险报案号</span>
          <span class="font-medium text-gray-900">{{
            caseData.casenoInsuredMain || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">附加险</span>
          <span class="font-medium text-gray-900">{{
            caseData.insuredAttachName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">附加险保单号</span>
          <span class="font-medium text-gray-900">{{
            caseData.policyNoAttach || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">附加险报案号</span>
          <span class="font-medium text-gray-900">{{
            caseData.casenoInsuredAttach || '-'
          }}</span>
        </div>
      </div>
    </section>

    <ElDivider class="!my-6 border-gray-100" />

    <!-- Section: Station Info -->
    <section>
      <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        站点信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">归属站点</span>
          <span class="font-medium text-gray-900">{{
            caseData.stopName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">所属客户</span>
          <span class="font-medium text-gray-900">{{
            caseData.companyName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">站长姓名（手机号）</span>
          <span class="font-medium text-gray-900">
            {{
              caseData.stopOwnerName
                ? `${caseData.stopOwnerName}(${caseData.stopOwnerPhone})`
                : '-'
            }}
          </span>
        </div>
      </div>
    </section>

    <template v-if="caseData.thirdParties && caseData.thirdParties.length > 0">
      <ElDivider class="!my-6 border-gray-100" />
      <section>
        <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
          <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
          三者信息
        </h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(item, index) in caseData.thirdParties"
            :key="index"
            class="rounded-lg border border-gray-100 bg-gray-50 p-4"
          >
            <div class="mb-3 font-bold text-gray-800">三者{{ index + 1 }}</div>
            <div class="grid grid-cols-1 gap-2">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-gray-500">姓名</span>
                <span class="font-medium text-gray-900">{{
                  item.name || '-'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-gray-500">手机号</span>
                <span class="font-medium text-gray-900">{{
                  item.phone || '-'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template v-if="!isLog">
      <ElDivider class="!my-6 border-gray-100" />

      <!-- Section: Accident Info -->
      <section>
        <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
          <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
          事故信息
        </h3>
        <div
          class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">责任判定</span>
            <span class="font-medium text-gray-900">
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
                            : '-'
              }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">出险类型</span>
            <span class="font-medium text-gray-900">
              {{
                caseData.insureType === 1
                  ? '自身受伤'
                  : caseData.insureType === 2
                    ? '三者受伤'
                    : caseData.insureType === 3
                      ? '三者物损'
                      : '-'
              }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">创建人</span>
            <span class="font-medium text-gray-900">{{
              caseData.username || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500">事故区域</span>
            <span class="font-medium text-gray-900">
              {{ caseData.province }} / {{ caseData.city }} /
              {{ caseData.district }}
            </span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500">事故详细地址</span>
            <span class="font-medium text-gray-900">{{
              caseData.address || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500">事故经过</span>
            <p
              class="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700"
            >
              {{ caseData.details || '-' }}
            </p>
          </div>
        </div>
      </section>

      <template v-if="showImages">
        <ElDivider class="!my-6 border-gray-100" />
        <section>
          <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            图像文件
          </h3>
          <CaseImages :picture-list="pictureList" :file-list="fileList" />
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* Styles moved to CaseImages.vue or no longer needed here if specific to images */
</style>
