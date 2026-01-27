<script lang="ts" setup>
import type { CaseApi } from '#/api/core/case';

import { computed, ref, watch } from 'vue';

import { ElDivider, ElTag } from 'element-plus';

import { PlanListApi } from '#/api/core/plan';
import { useCaseStore } from '#/store/case';
import { formatTimestamp } from '#/utils/dateUtils';

import CaseImages from './CaseImages.vue';

const props = withDefaults(defineProps<Props>(), {
  caseId: '',
  isLog: false,
  pictureList: () => ({}),
  fileList: () => [],
  showImages: true,
});

const caseStore = useCaseStore();

interface Props {
  caseId?: number | string;
  caseInfo: CaseApi.CaseForm;
  isLog?: boolean;
  pictureList?: Record<string, string>;
  fileList?: CaseApi.TbCaseFiles[];
  showImages?: boolean;
}

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

// Computed Properties for Status Display
const statusInfo = computed(() => {
  const { cosed, exceptionTag, guaqiTag } = props.caseInfo;
  const isClosed = cosed === 1;
  const isException = exceptionTag === 1;
  const isSuspended = guaqiTag === 1;

  if (isClosed) {
    if (isException) {
      return { label: '异常案件结案', type: 'info' as const };
    }
    return { label: '结案', type: 'info' as const };
  }

  if (isSuspended) {
    if (isException) {
      return { label: '异常案件挂起', type: 'warning' as const };
    }
    return { label: '挂起', type: 'warning' as const };
  }

  // Processing
  if (isException) {
    return { label: '异常案件理赔中', type: 'danger' as const };
  }
  return { label: '理赔中', type: 'success' as const };
});

const exceptionTags = computed(() => {
  const { exceptionTag, exceptionType } = props.caseInfo;
  if (exceptionTag !== 1 || !exceptionType) return [];
  return caseStore.getExceptionLabels(String(exceptionType));
});

const hangUpTags = computed(() => {
  const { guaqiTag, guaqiType } = props.caseInfo;
  if (guaqiTag !== 1 || !guaqiType) return [];
  return caseStore.getSuspendLabels(String(guaqiType));
});
</script>

<template>
  <div class="space-y-8 p-2">
    <!-- Section: Basic Info -->
    <section>
      <h3
        class="mb-4 flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
      >
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        基本信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">案件编号</span>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              caseData.id
            }}</span>

            <!-- Main Status Tag -->
            <ElTag
              v-if="statusInfo"
              :type="statusInfo.type"
              size="small"
              effect="dark"
            >
              {{ statusInfo.label }}
            </ElTag>

            <!-- Extra Tags (Exception Types) -->
            <ElTag
              v-for="tag in exceptionTags"
              :key="tag"
              type="danger"
              size="small"
              effect="plain"
              class="!border-red-200 !text-red-600"
            >
              {{ tag }}
            </ElTag>

            <!-- Extra Tags (HangUp Types) -->
            <ElTag
              v-for="tag in hangUpTags"
              :key="tag"
              type="warning"
              size="small"
              effect="plain"
              class="!border-orange-200 !text-orange-600"
            >
              {{ tag }}
            </ElTag>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">创建时间</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            formatTimestamp(caseData.created!)
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">创建人</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.username || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >案件总用时</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.stayTime || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >案件总用时状态</span
          >
          <div v-if="caseData.timeout">
            <ElTag
              v-if="caseData.timeout === 1"
              type="warning"
              size="small"
              class="!border-orange-200 !text-orange-600"
            >
              总用时超时
            </ElTag>
            <ElTag
              v-else-if="caseData.timeout === 2"
              type="danger"
              size="small"
              class="!border-red-200 !text-red-600"
            >
              总用时严重超时
            </ElTag>
            <span v-else class="font-medium text-gray-900 dark:text-gray-100"
              >-</span
            >
          </div>
          <span v-else class="font-medium text-gray-900 dark:text-gray-100"
            >-</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">骑手姓名</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.name
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">身份证号</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.creditcard
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">手机号</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.phone
          }}</span>
        </div>
      </div>
    </section>

    <!-- Section: Accident Info (Moved) -->
    <template v-if="!isLog">
      <ElDivider class="!my-6 border-gray-100" />
      <section>
        <h3
          class="mb-4 flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
        >
          <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
          事故信息
        </h3>
        <div
          class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >责任判定</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">
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
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >出险类型</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">
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
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >出险时间</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              formatTimestamp(caseData.insureTime!)
            }}</span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >事故区域</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ caseData.province }} / {{ caseData.city }} /
              {{ caseData.district }}
            </span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >事故详细地址</span
            >
            <span class="font-medium text-gray-900">{{
              caseData.address || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >事故经过</span
            >
            <p
              class="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-slate-800 dark:text-gray-300"
            >
              {{ caseData.details || '-' }}
            </p>
          </div>
        </div>
      </section>
    </template>

    <ElDivider class="!my-6 border-gray-100" />
    <!-- Section: Insurance Info -->
    <section>
      <h3
        class="mb-4 flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
      >
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        保险信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">保险编码</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            planName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >有无附加险</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.fujiaxian === '1' ? '有' : '无'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">赔偿对象</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">
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
          <span class="text-xs text-gray-500 dark:text-gray-400">主险</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.insuredMainName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >主险保单号</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.policyNo || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >主险报案号</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.casenoInsuredMain || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">附加险</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.insuredAttachName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >附加险保单号</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.policyNoAttach || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >附加险报案号</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.casenoInsuredAttach || '-'
          }}</span>
        </div>
      </div>
    </section>

    <ElDivider class="!my-6 border-gray-100" />

    <!-- Section: Station Info -->
    <section>
      <h3
        class="mb-4 flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
      >
        <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
        站点信息
      </h3>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">归属站点</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.stopName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">所属客户</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            caseData.companyName || '-'
          }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >站长姓名（手机号）</span
          >
          <span class="font-medium text-gray-900 dark:text-gray-100">
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
        <h3
          class="mb-4 flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
        >
          <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
          三者信息
        </h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(item, index) in caseData.thirdParties"
            :key="index"
            class="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-800"
          >
            <div class="mb-3 font-bold text-gray-800 dark:text-gray-100">
              三者{{ index + 1 }}
            </div>
            <div class="grid grid-cols-1 gap-2">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >姓名</span
                >
                <span class="font-medium text-gray-900 dark:text-gray-100">{{
                  item.name || '-'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >手机号</span
                >
                <span class="font-medium text-gray-900 dark:text-gray-100">{{
                  item.phone || '-'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template v-if="!isLog && showImages">
      <ElDivider class="!my-6 border-gray-100" />
      <section>
        <h3 class="mb-4 flex items-center text-base font-bold text-gray-900">
          <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
          图像文件
        </h3>
        <CaseImages :picture-list="pictureList" :file-list="fileList" />
      </section>
    </template>
  </div>
</template>

<style scoped>
/* Styles moved to CaseImages.vue or no longer needed here if specific to images */
</style>
