<script lang="ts" setup>
import type { CaseApi } from '#/api/core/case';
import type { TbCaseFinal } from '#/api/core/case-final';
import type { CaseMoneyApi } from '#/api/core/case-money';

import { computed, nextTick, ref, watch } from 'vue';

import { DocumentCopy, Download } from '@element-plus/icons-vue';
import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElMessage,
  ElTag,
} from 'element-plus';
import html2canvas from 'html2canvas';

import { getTimelineListApi } from '#/api/core/case-timeline';
import { PlanListApi } from '#/api/core/plan';
import { useCaseStore } from '#/store/case';
import { formatTimestamp } from '#/utils/dateUtils';

import {
  AccidentTypeOptions,
  getLabelFromValue,
  LiabilityOptions,
  SpecialDeterminationOptions,
} from '../constants';
import CaseImages from './CaseImages.vue';

const props = withDefaults(defineProps<Props>(), {
  caseId: '',
  isLog: false,
  pictureList: () => ({}),
  fileList: () => [],
  showImages: true,
  lossAssessmentRecord: null,
  finalRecords: () => [],
});

const caseStore = useCaseStore();

interface Props {
  caseId?: number | string;
  caseInfo: CaseApi.CaseForm;
  isLog?: boolean;
  pictureList?: Record<string, string>;
  fileList?: CaseApi.TbCaseFiles[];
  showImages?: boolean;
  lossAssessmentRecord?: CaseMoneyApi.TbCaseMoneyDetails | null;
  finalRecords?: TbCaseFinal[];
}

// 声明默认展开折叠栏的激活项，默认仅展开基本信息
const activeNames = ref(['basic']);

// 格式化责任认定类型展示
const formattedZeren = computed(() => {
  const zeren = props.lossAssessmentRecord?.zeren;
  if (!zeren) return '';

  try {
    if (zeren.startsWith('{')) {
      const zerenObj = JSON.parse(zeren);
      const parts: string[] = [];

      if (zerenObj.rider) {
        parts.push(
          `骑手: ${getLabelFromValue(zerenObj.rider, LiabilityOptions)}`,
        );
      }

      // 排序三者
      const tpKeys = Object.keys(zerenObj)
        .filter((k) => k.startsWith('tp_'))
        .toSorted((a, b) => {
          const idxA = Number(a.split('_')[1]);
          const idxB = Number(b.split('_')[1]);
          return idxA - idxB;
        });

      tpKeys.forEach((key) => {
        const index = Number(key.split('_')[1]);
        parts.push(
          `三者${index + 1}: ${getLabelFromValue(zerenObj[key], LiabilityOptions)}`,
        );
      });

      return parts.join('; ');
    }
  } catch (error) {
    console.warn('解析责任认定失败', error);
  }

  return getLabelFromValue(zeren, LiabilityOptions);
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

const latestLog = ref<any>(null);

const fetchLatestLog = async (id: number | string) => {
  if (!id) return;
  try {
    // 增加获取量，寻找有效备注
    const res = await getTimelineListApi({
      id: String(id),
      page: 1,
      size: 50,
    });
    if (res.list && res.list.length > 0) {
      // 寻找第一条 remark 不为空的记录
      const validLog = res.list.find(
        (item) => item.remark && item.remark.trim() !== '',
      );
      latestLog.value = validLog || null;
    } else {
      latestLog.value = null;
    }
  } catch (error) {
    console.error('获取时间轴备注失败:', error);
  }
};

// Computed Properties for Status Display
const statusInfo = computed(() => {
  const { cosed, exceptionTag, guaqiTag, closeReason } = props.caseInfo;
  const isClosed = cosed === 1;
  const isException = exceptionTag === 1;
  const isSuspended = guaqiTag === 1;

  if (isClosed) {
    const reasonTag = closeReason ? `-${closeReason}` : '';
    if (isException) {
      return { label: `异常案件已结案${reasonTag}`, type: 'info' as const };
    }
    return { label: `已结案${reasonTag}`, type: 'info' as const };
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

const thirdPartiesList = computed(() => {
  if (caseData.value.thirdParties && caseData.value.thirdParties.length > 0) {
    return caseData.value.thirdParties.filter(
      (item: any) => item.zt !== '骑手',
    );
  }
  if (caseData.value.zts && caseData.value.zts.length > 0) {
    return caseData.value.zts.filter((item: any) => item.zt !== '骑手');
  }
  return [];
});

const isExporting = ref(false);
const exportPosterRef = ref<HTMLElement | null>(null);
const previewDialogVisible = ref(false);
const previewImageUrl = ref('');
const previewBlob = ref<Blob | null>(null);

const exportImage = async () => {
  if (!exportPosterRef.value) return;
  isExporting.value = true;
  try {
    // 导出前先加载最新的备注信息
    await fetchLatestLog(caseData.value.id!);

    await nextTick();
    // 释放主线程以保证 UI (按钮 Loading) 能够被浏览器渲染出来
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 修复方案：临时覆盖 Tailwind 的 img { display: block } 导致的 html2canvas 基线计算异常
    const resetStyle = document.createElement('style');
    resetStyle.innerHTML =
      'img, svg, video, canvas, audio, iframe, embed, object { display: inline !important; }';
    document.head.append(resetStyle);

    const canvas = await html2canvas(exportPosterRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8fafc',
    });

    if (resetStyle.parentNode) {
      resetStyle.remove();
    }

    canvas.toBlob((blob) => {
      isExporting.value = false;
      if (!blob) {
        ElMessage.error('生成图片失败');
        return;
      }
      previewBlob.value = blob;
      previewImageUrl.value = URL.createObjectURL(blob);
      previewDialogVisible.value = true;
    }, 'image/png');
  } catch (error) {
    console.error('导出海报异常:', error);
    ElMessage.error('导出图片失败');
    isExporting.value = false;
  }
};

const copyPreviewImage = async () => {
  if (!previewBlob.value) return;
  try {
    const item = new ClipboardItem({ 'image/png': previewBlob.value });
    await navigator.clipboard.write([item]);
    ElMessage.success('✅ 图片已复制到剪贴板，请直接粘贴');
    previewDialogVisible.value = false;
  } catch (error) {
    console.warn('剪贴板写入失败:', error);
    ElMessage.error('当前环境不支持直接复制，请使用保存本地或右键图片另存为');
  }
};

const downloadPreviewImage = () => {
  if (!previewImageUrl.value) return;
  const link = document.createElement('a');
  link.href = previewImageUrl.value;
  link.download = `案件速览-${caseData.value.id || '最新'}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  ElMessage.success('🎉 图片已下载保存');
  previewDialogVisible.value = false;
};

defineExpose({
  exportImage,
  isExporting,
});
</script>

<template>
  <div class="space-y-8 p-2">
    <ElCollapse v-model="activeNames" class="custom-collapse border-none">
      <!-- Section: Basic Info -->
      <ElCollapseItem name="basic">
        <template #title>
          <div class="flex flex-1 items-center justify-between pr-4">
            <h3
              class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
            >
              <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
              基本信息
            </h3>
            <ElButton
              type="primary"
              plain
              size="small"
              :loading="isExporting"
              @click.stop="exportImage"
            >
              导出图片
            </ElButton>
          </div>
        </template>
        <div
          class="grid grid-cols-1 gap-x-8 gap-y-6 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >案件编号</span
            >
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
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >创建时间</span
            >
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
            <div
              v-if="caseData.timeout !== undefined && caseData.timeout !== null"
            >
              <ElTag v-if="caseData.timeout === 0" type="success" size="small">
                暂未超时
              </ElTag>
              <ElTag
                v-else-if="caseData.timeout === 1"
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
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >骑手姓名</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              caseData.name
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >身份证号</span
            >
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
      </ElCollapseItem>

      <!-- Section: 赔付摘要 -->
      <ElCollapseItem name="summary">
        <template #title>
          <h3
            class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            赔付摘要
          </h3>
        </template>
        <div
          class="grid grid-cols-1 gap-x-8 gap-y-6 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >事故类型</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              getLabelFromValue(
                lossAssessmentRecord?.types,
                AccidentTypeOptions,
              ) || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >责任类型</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              formattedZeren || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >特殊判定</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              getLabelFromValue(
                lossAssessmentRecord?.panding,
                SpecialDeterminationOptions,
              ) || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >最终赔付汇总</span
            >
            <div class="mt-1 flex flex-wrap gap-2">
              <template v-if="finalRecords && finalRecords.length > 0">
                <template v-for="(item, index) in finalRecords" :key="index">
                  <ElTag
                    v-if="
                      item.moneyMain !== undefined && item.moneyMain !== null
                    "
                    type="success"
                    effect="light"
                    class="!px-3 !py-1"
                  >
                    【{{ item.ztName || '未知主体' }} - 最终赔付 -
                    {{ item.moneyMain }}元】
                  </ElTag>
                </template>
              </template>
              <span v-else class="text-sm text-gray-400 dark:text-gray-500"
                >暂无最终赔付记录</span
              >
            </div>
          </div>
        </div>
      </ElCollapseItem>

      <!-- Section: Accident Info -->
      <ElCollapseItem v-if="!isLog" name="accident">
        <template #title>
          <h3
            class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            事故信息
          </h3>
        </template>
        <div
          class="grid grid-cols-1 gap-x-8 gap-y-6 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
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
              >医疗情况描述</span
            >
            <p
              class="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-slate-800 dark:text-gray-300"
            >
              {{ caseData.addressPicture || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >车损情况描述</span
            >
            <p
              class="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-slate-800 dark:text-gray-300"
            >
              {{ caseData.accidentPicture || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >责任认定情况</span
            >
            <p
              class="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-slate-800 dark:text-gray-300"
            >
              {{ caseData.orderPicture || '-' }}
            </p>
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
              >事故经过 / 详细描述</span
            >
            <div
              class="mt-1 flex flex-col gap-2 rounded-md bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-slate-800 dark:text-gray-300"
            >
              <p v-if="caseData.details">{{ caseData.details }}</p>
              <p v-if="caseData.addressPicture">
                地点描述: {{ caseData.addressPicture }}
              </p>
              <p v-if="caseData.orderPicture">
                订单描述: {{ caseData.orderPicture }}
              </p>
              <p v-if="caseData.accidentPicture">
                事故描述: {{ caseData.accidentPicture }}
              </p>
              <p
                v-if="
                  !caseData.details &&
                  !caseData.addressPicture &&
                  !caseData.orderPicture &&
                  !caseData.accidentPicture
                "
              >
                -
              </p>
            </div>
          </div>
        </div>
      </ElCollapseItem>

      <!-- Section: Insurance Info -->
      <ElCollapseItem name="insurance">
        <template #title>
          <h3
            class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            保险信息
          </h3>
        </template>
        <div class="p-4">
          <!-- 主险信息 -->
          <div
            v-if="caseData.policyNo || caseData.insuredMainName"
            class="mb-2 flex items-center"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-400"></span>
            <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200">
              主险信息
            </h4>
          </div>
          <div
            v-if="caseData.policyNo || caseData.insuredMainName"
            class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保单系统编号</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.goodPicture || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保障编码</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.bxbm || '-'
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
                >保险公司</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.companyMain || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >主险方案</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.insuredMainName || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >所属客户</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.companyName || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >所属渠道</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.channelName || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >投保人</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.tbr || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >被保人</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.bbr || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保单PDF</span
              >
              <div class="flex items-center gap-2">
                <template v-if="caseData.diseasePicture">
                  <a :href="caseData.diseasePicture" target="_blank">
                    <ElButton
                      type="primary"
                      size="small"
                      plain
                      :icon="Download"
                    >
                      下载保单
                    </ElButton>
                  </a>
                </template>
                <span v-else class="text-gray-400">-</span>
              </div>
            </div>
          </div>

          <!-- 附加险信息 -->
          <div
            v-if="caseData.policyNoAttach || caseData.insuredAttachName"
            class="mb-2 mt-8 flex items-center"
          >
            <span class="mr-2 h-4 w-1 rounded bg-green-400"></span>
            <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200">
              附加险信息
            </h4>
          </div>
          <div
            v-if="caseData.policyNoAttach || caseData.insuredAttachName"
            class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保单系统编号</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.goodPicture || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保障编码</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.bxbm || '-'
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
                >保险公司</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.companyAttach || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >附加险方案</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.insuredAttachName || '-'
              }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >所属客户</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.companyName || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >所属渠道</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.channelName || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >投保人</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.tbrAttach || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >被保人</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.bbrAttach || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保单PDF</span
              >
              <div class="flex items-center gap-2">
                <template v-if="caseData.diseasePicture">
                  <a :href="caseData.diseasePicture" target="_blank">
                    <ElButton
                      type="primary"
                      size="small"
                      plain
                      :icon="Download"
                    >
                      下载保单
                    </ElButton>
                  </a>
                </template>
                <span v-else class="text-gray-400">-</span>
              </div>
            </div>
          </div>

          <!-- 新职伤信息 -->
          <div
            v-if="
              caseData.insured_xinzhishang || caseData.insured_xinzhishang_name
            "
            class="mb-2 mt-8 flex items-center"
          >
            <span class="mr-2 h-4 w-1 rounded bg-purple-400"></span>
            <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200">
              新职伤信息
            </h4>
          </div>
          <div
            v-if="
              caseData.insured_xinzhishang || caseData.insured_xinzhishang_name
            "
            class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >新职伤保单号</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.insured_xinzhishang || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >保险公司</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.company_xinzhishang || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >新职伤方案</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.insured_xinzhishang_name || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >投保人</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.tbr_xinzhishang || '-'
              }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >被保人</span
              >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                caseData.bbr_xinzhishang || '-'
              }}</span>
            </div>
          </div>
        </div>
      </ElCollapseItem>

      <!-- Section: Station Info -->
      <ElCollapseItem name="station">
        <template #title>
          <h3
            class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            站点信息
          </h3>
        </template>
        <div
          class="grid grid-cols-1 gap-x-8 gap-y-6 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >归属站点</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              caseData.stopName || '-'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >所属客户</span
            >
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
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >骑手 ID</span
            >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              caseData.oritext || '-'
            }}</span>
          </div>
        </div>
      </ElCollapseItem>

      <!-- Section: Third Party Info -->
      <ElCollapseItem
        v-if="thirdPartiesList && thirdPartiesList.length > 0"
        name="third_party"
      >
        <template #title>
          <h3
            class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            三者信息
          </h3>
        </template>
        <div class="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(item, index) in thirdPartiesList as any[]"
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
                  item.username || item.name || '-'
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
              <div
                class="mt-1 flex w-full flex-col gap-1 rounded-sm bg-white p-2 dark:bg-slate-900"
              >
                <span class="text-xs text-gray-500 dark:text-gray-400"
                  >备注</span
                >
                <span
                  class="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100"
                  style="word-break: break-all"
                  >{{ item.comments || '无' }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </ElCollapseItem>

      <!-- Section: Image Files -->
      <ElCollapseItem v-if="!isLog && showImages" name="images">
        <template #title>
          <h3
            class="flex items-center text-base font-bold text-gray-900 dark:text-gray-100"
          >
            <span class="mr-2 h-4 w-1 rounded bg-blue-600"></span>
            图像文件
          </h3>
        </template>
        <div class="p-4">
          <CaseImages :picture-list="pictureList" :file-list="fileList" />
        </div>
      </ElCollapseItem>
    </ElCollapse>

    <Teleport to="body">
      <!-- 隐形的专属导出海报区 -->
      <div
        style="position: absolute; top: 0; left: -9999px; pointer-events: none"
      >
        <div
          ref="exportPosterRef"
          style="
            position: relative;
            width: 375px;
            padding-bottom: 32px;
            font-family: system-ui, sans-serif;
            color: #334155;
            background: linear-gradient(to bottom, #f8fafc, #eef2f6);
          "
        >
          <!-- 背景装饰块 -->
          <div
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 160px;
              pointer-events: none;
              background: linear-gradient(
                to bottom,
                rgb(219 234 254 / 60%),
                transparent
              );
            "
          ></div>

          <!-- 内容 -->
          <div style="position: relative; z-index: 1; padding: 24px 16px 0">
            <!-- 头部 -->
            <div
              style="
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 8px;
                padding-bottom: 16px;
                margin-bottom: 24px;
                border-bottom: 1px solid rgb(203 213 225 / 60%);
              "
            >
              <h2
                style="
                  margin: 0;
                  font-size: 22px;
                  font-weight: 900;
                  color: #0f172a;
                  letter-spacing: -0.5px;
                "
              >
                理赔案件速览
              </h2>
              <div style="margin-top: 8px; font-size: 13px; color: #64748b">
                单号：{{ caseData.id }}
              </div>
              <div
                style="
                  display: flex;
                  flex-wrap: wrap;
                  gap: 6px;
                  align-items: center;
                  justify-content: center;
                  max-width: 320px;
                  margin-top: 10px;
                "
              >
                <!-- 主状态 -->
                <span
                  v-if="statusInfo"
                  :style="{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '18px',
                    padding: '0 8px',
                    backgroundColor:
                      statusInfo.type === 'warning'
                        ? '#eab308'
                        : statusInfo.type === 'success'
                          ? '#22c55e'
                          : statusInfo.type === 'danger'
                            ? '#ef4444'
                            : statusInfo.type === 'info'
                              ? '#94a3b8'
                              : '#3b82f6',
                    color: '#fff',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }"
                >
                  {{ statusInfo.label }}
                </span>
                <!-- 异常情况 -->
                <span
                  v-for="tag in exceptionTags"
                  :key="`exc-${tag}`"
                  style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 18px;
                    padding: 0 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #ef4444;
                    background-color: #fef2f2;
                    border: 1px solid #fca5a5;
                    border-radius: 4px;
                  "
                >
                  {{ tag }}
                </span>
                <!-- 挂起情况 -->
                <span
                  v-for="tag in hangUpTags"
                  :key="`hang-${tag}`"
                  style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 18px;
                    padding: 0 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #ea580c;
                    background-color: #fff7ed;
                    border: 1px solid #fdba74;
                    border-radius: 4px;
                  "
                >
                  {{ tag }}
                </span>
              </div>

              <!-- 最新动态/沟通记录 -->
              <div
                v-if="latestLog"
                style="
                  box-sizing: border-box;
                  width: 100%;
                  padding: 12px;
                  margin-top: 12px;
                  background: rgb(255 255 255 / 90%);
                  border: 1px solid #e2e8f0;
                  border-left: 4px solid #4f46e5;
                  border-radius: 12px;
                  box-shadow: 0 1px 4px rgb(79 70 229 / 10%);
                "
              >
                <div
                  style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 4px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #4f46e5;
                    letter-spacing: 0.5px;
                  "
                >
                  <span
                    style="
                      display: inline-block;
                      width: 6px;
                      height: 6px;
                      margin-right: 5px;
                      background: #4f46e5;
                      border-radius: 50%;
                    "
                  ></span>
                  最新沟通备注
                </div>
                <div
                  style="
                    font-size: 12px;
                    line-height: 1.5;
                    color: #1e293b;
                    word-break: break-all;
                  "
                >
                  <span style="font-weight: 700; color: #0f172a">{{
                    latestLog.nickname || latestLog.username || '系统'
                  }}</span>
                  <span style="margin: 0 4px; color: #64748b"
                    >于 {{ formatTimestamp(latestLog.lockTime) }}
                    {{ latestLog.roleName || '提交' }}</span
                  >
                  <div
                    v-if="latestLog.remark"
                    style="
                      padding-top: 4px;
                      margin-top: 4px;
                      font-family: monospace;
                      font-size: 12px;
                      color: #334155;
                      white-space: pre-wrap;
                      border-top: 1px dashed #cbd5e1;
                    "
                  >
                    {{ latestLog.remark }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 基本信息 -->
            <div
              style="
                padding: 16px;
                margin-bottom: 12px;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                box-shadow: 0 1px 6px rgb(148 163 184 / 15%);
              "
            >
              <h4
                style="
                  margin: 0 0 12px;
                  font-size: 13px;
                  font-weight: 700;
                  color: #0f172a;
                "
              >
                <span style="color: #3b82f6">▎</span> 基本信息
              </h4>
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  font-size: 13px;
                "
              >
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >创建时间</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ formatTimestamp(caseData.created!) }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >创建人</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.username || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >案件总用时</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.stayTime || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 90px; color: #64748b"
                    >案件总用时状态</span
                  >
                  <div style="flex: 1; text-align: right">
                    <span
                      v-if="!caseData.timeout || caseData.timeout === 0"
                      style="font-weight: 700; color: #0f172a"
                      >-</span
                    >
                    <span
                      v-else-if="caseData.timeout === 1"
                      style="
                        display: inline-flex;
                        align-items: center;
                        height: 18px;
                        padding: 0 6px;
                        font-size: 11px;
                        font-weight: 500;
                        color: #ea580c;
                        background-color: #fff7ed;
                        border: 1px solid #fdba74;
                        border-radius: 4px;
                      "
                      >总用时超时</span
                    >
                    <span
                      v-else-if="caseData.timeout === 2"
                      style="
                        display: inline-flex;
                        align-items: center;
                        height: 18px;
                        padding: 0 6px;
                        font-size: 11px;
                        font-weight: 500;
                        color: #ef4444;
                        background-color: #fef2f2;
                        border: 1px solid #fca5a5;
                        border-radius: 4px;
                      "
                      >总用时严重超时</span
                    >
                  </div>
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >骑手姓名</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.name || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >手机号</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.phone || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >身份证号</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.creditcard || '-' }}</span
                  >
                </div>
              </div>
            </div>

            <!-- 主险信息 -->
            <div
              v-if="caseData.policyNo"
              style="
                padding: 16px;
                margin-bottom: 12px;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                box-shadow: 0 1px 6px rgb(148 163 184 / 15%);
              "
            >
              <h4
                style="
                  margin: 0 0 12px;
                  font-size: 13px;
                  font-weight: 700;
                  color: #0f172a;
                "
              >
                <span style="color: #6366f1">▎</span> 主险信息
              </h4>
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  font-size: 13px;
                "
              >
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >保障编码</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.bxbm || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >主险方案</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.insuredMainName || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >保单号</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.policyNo || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >保险公司</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{
                      caseData.companyMain || caseData.companyName || '-'
                    }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >所属客户</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.customerName || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >所属渠道</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.channelName || '-' }}</span
                  >
                </div>
              </div>
            </div>

            <!-- 附加险信息 -->
            <div
              v-if="caseData.policyNoAttach"
              style="
                padding: 16px;
                margin-bottom: 12px;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                box-shadow: 0 1px 6px rgb(148 163 184 / 15%);
              "
            >
              <h4
                style="
                  margin: 0 0 12px;
                  font-size: 13px;
                  font-weight: 700;
                  color: #0f172a;
                "
              >
                <span style="color: #10b981">▎</span> 附加险信息
              </h4>
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  font-size: 13px;
                "
              >
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >保障编码</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.bxbm || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >附加险方案</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.insuredAttachName || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >保单号</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.policyNoAttach || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >保险公司</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.companyAttach || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >所属客户</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.customerName || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >所属渠道</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                    "
                    >{{ caseData.channelName || '-' }}</span
                  >
                </div>
              </div>
            </div>

            <!-- 事故与定责 -->
            <div
              style="
                padding: 16px;
                margin-bottom: 12px;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                box-shadow: 0 1px 6px rgb(148 163 184 / 15%);
              "
            >
              <h4
                style="
                  margin: 0 0 12px;
                  font-size: 13px;
                  font-weight: 700;
                  color: #0f172a;
                "
              >
                <span style="color: #f43f5e">▎</span> 事故与定责
              </h4>
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  font-size: 13px;
                "
              >
                <div
                  style="padding-bottom: 8px; border-bottom: 1px solid #f8fafc"
                >
                  <div
                    style="margin-bottom: 3px; font-size: 11px; color: #94a3b8"
                  >
                    出险时间
                  </div>
                  <div style="font-weight: 500; color: #0f172a">
                    {{ formatTimestamp(caseData.insureTime!) || '-' }}
                  </div>
                </div>
                <div
                  style="padding-bottom: 8px; border-bottom: 1px solid #f8fafc"
                >
                  <div
                    style="margin-bottom: 3px; font-size: 11px; color: #94a3b8"
                  >
                    出险地点
                  </div>
                  <div
                    style="font-weight: 500; line-height: 1.6; color: #0f172a"
                  >
                    {{ caseData.province }}{{ caseData.city
                    }}{{ caseData.district }} {{ caseData.address || '' }}
                  </div>
                </div>
                <div
                  style="padding-bottom: 8px; border-bottom: 1px solid #f8fafc"
                >
                  <div
                    style="margin-bottom: 3px; font-size: 11px; color: #94a3b8"
                  >
                    医疗情况描述
                  </div>
                  <div
                    style="font-weight: 500; line-height: 1.6; color: #0f172a"
                  >
                    {{ caseData.addressPicture || '-' }}
                  </div>
                </div>
                <div
                  style="padding-bottom: 8px; border-bottom: 1px solid #f8fafc"
                >
                  <div
                    style="margin-bottom: 3px; font-size: 11px; color: #94a3b8"
                  >
                    车损情况描述
                  </div>
                  <div
                    style="font-weight: 500; line-height: 1.6; color: #0f172a"
                  >
                    {{ caseData.accidentPicture || '-' }}
                  </div>
                </div>
                <div
                  style="padding-bottom: 8px; border-bottom: 1px solid #f8fafc"
                >
                  <div
                    style="margin-bottom: 3px; font-size: 11px; color: #94a3b8"
                  >
                    事故描述
                  </div>
                  <div
                    style="font-weight: 500; line-height: 1.6; color: #0f172a"
                  >
                    {{ caseData.details || '-' }}
                  </div>
                </div>
                <div>
                  <div
                    style="margin-bottom: 3px; font-size: 11px; color: #94a3b8"
                  >
                    责任认定情况
                  </div>
                  <div
                    style="font-weight: 500; line-height: 1.6; color: #0f172a"
                  >
                    {{ caseData.orderPicture || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 归属站点 -->
            <div
              style="
                padding: 16px;
                margin-bottom: 8px;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                box-shadow: 0 1px 6px rgb(148 163 184 / 15%);
              "
            >
              <h4
                style="
                  margin: 0 0 12px;
                  font-size: 13px;
                  font-weight: 700;
                  color: #0f172a;
                "
              >
                <span style="color: #14b8a6">▎</span> 归属站点
              </h4>
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  font-size: 13px;
                "
              >
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >站名归属</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.stopName || '-' }} |
                    {{ caseData.companyName || '-' }}</span
                  >
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                    padding-top: 8px;
                    margin-top: 8px;
                    border-top: 1px solid #f8fafc;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >站长及电话</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                  >
                    {{
                      caseData.stopOwnerName
                        ? `${caseData.stopOwnerName}(${caseData.stopOwnerPhone})`
                        : '-'
                    }}
                  </span>
                </div>
                <div
                  style="
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    justify-content: space-between;
                    padding-top: 8px;
                    margin-top: 8px;
                    border-top: 1px solid #f8fafc;
                  "
                >
                  <span style="flex-shrink: 0; min-width: 70px; color: #64748b"
                    >骑手 ID</span
                  >
                  <span
                    style="
                      flex: 1;
                      font-weight: 700;
                      color: #0f172a;
                      text-align: right;
                      word-break: break-all;
                    "
                    >{{ caseData.oritext || '-' }}</span
                  >
                </div>
              </div>
            </div>

            <!-- 三者信息 -->
            <div
              v-if="thirdPartiesList && thirdPartiesList.length > 0"
              style="
                padding: 16px;
                margin-bottom: 8px;
                background: #fff;
                border: 1px solid #f1f5f9;
                border-radius: 12px;
                box-shadow: 0 1px 6px rgb(148 163 184 / 15%);
              "
            >
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 12px;
                "
              >
                <h4
                  style="
                    margin: 0;
                    font-size: 13px;
                    font-weight: 700;
                    color: #0f172a;
                  "
                >
                  <span style="color: #f59e0b">▎</span> 三者信息
                </h4>
                <span style="font-size: 12px; font-weight: 700; color: #0f172a"
                  >共 {{ thirdPartiesList.length }} 人</span
                >
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px">
                <div
                  v-for="(tp, idx) in thirdPartiesList as any[]"
                  :key="idx"
                  style="
                    padding: 12px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                  "
                >
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      margin-bottom: 8px;
                    "
                  >
                    <span
                      style="font-size: 13px; font-weight: 700; color: #0f172a"
                      >三者{{ idx + 1 }}：{{
                        tp.username || tp.name || '-'
                      }}</span
                    >
                    <span
                      style="
                        font-family: monospace;
                        font-size: 12px;
                        color: #64748b;
                      "
                      >{{ tp.phone || '-' }}</span
                    >
                  </div>
                  <div
                    style="
                      padding: 8px 10px;
                      font-size: 12px;
                      line-height: 1.5;
                      background: #fff;
                      border: 1px solid #f1f5f9;
                      border-radius: 4px;
                    "
                  >
                    <span style="margin-right: 4px; color: #94a3b8"
                      >三者备注:</span
                    >
                    <span style="color: #334155; word-break: break-all">{{
                      tp.comments || '无'
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部署名 -->
            <div
              style="
                margin-top: 32px;
                font-size: 11px;
                color: #94a3b8;
                text-align: center;
                letter-spacing: 0.03em;
              "
            >
              {{ formatTimestamp(Date.now()) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 弹窗预览 -->
      <ElDialog
        v-model="previewDialogVisible"
        title=""
        width="400px"
        center
        append-to-body
        class="rounded-2xl"
      >
        <div class="flex flex-col items-center">
          <p class="mb-4 text-xs text-gray-500">
            图片已为您准备好，您可以直接复制或是下载原图保存。
          </p>
          <div
            class="rounded-xl border border-gray-100 bg-gray-50 p-2 shadow-inner"
          >
            <img
              :src="previewImageUrl"
              class="max-w-full rounded-lg shadow-md"
              alt="预览海报"
            />
          </div>
        </div>
        <template #footer>
          <div class="mb-2 mt-2 flex justify-center gap-4">
            <ElButton
              type="primary"
              size="large"
              class="w-28 rounded-full !shadow-md shadow-blue-500/20"
              @click="copyPreviewImage"
              :icon="DocumentCopy"
            >
              复制图片
            </ElButton>
            <ElButton
              size="large"
              class="w-28 rounded-full"
              @click="downloadPreviewImage"
              :icon="Download"
            >
              保存本地
            </ElButton>
          </div>
        </template>
      </ElDialog>
    </Teleport>
  </div>
</template>

<style scoped>
:deep(.custom-collapse) {
  background-color: transparent;
  border-top: none;
  border-bottom: none;
}

:deep(.custom-collapse .el-collapse-item__header) {
  padding: 0 8px;
  font-size: 15px;
  font-weight: 600;
  background-color: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.custom-collapse .el-collapse-item__wrap) {
  background-color: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.custom-collapse .el-collapse-item__content) {
  padding: 16px 8px;
}

/* 深度定制：折叠栏激活时的头部下边框颜色微调 */
:deep(.custom-collapse .el-collapse-item.is-active .el-collapse-item__header) {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary-light-8);
}
</style>
