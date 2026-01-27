<script lang="ts" setup>
import type { TbCaseComment } from '#/api/core/case-comment';
import type { TbCaseFinal } from '#/api/core/case-final';
import type { CaseMoneyApi } from '#/api/core/case-money';
import type { TbCasePeifu } from '#/api/core/case-peifu';
import type { TbCaseUserTimeline } from '#/api/core/case-timeline';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { ElButton, ElIcon, ElMessage } from 'element-plus';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { getCaseCommentPostListApi } from '#/api/core/case-comment';
import { updateCaseFinalApi } from '#/api/core/case-final';

import {
  AccidentTypeOptions,
  getLabelFromValue,
  getLabelsFromValues,
  LiabilityOptions,
  SpecialDeterminationOptions,
} from '../constants';
// Adjustment Letter Logic
import AdjustmentLetterModal from './AdjustmentLetterModal.vue';
import CompensationPostTable from './CompensationPostTable.vue';
import DockingPostTable from './DockingPostTable.vue';
import TimelineDealHistory from './TimelineDealHistory.vue';
import VoucherUploadModal from './VoucherUploadModal.vue';

interface Props {
  item: TbCaseUserTimeline;
  caseForm: any;
  commentRecords?: TbCaseComment[];

  peifuRecords?: TbCasePeifu[];
  finalRecords?: TbCaseFinal[];
  isFirstItem?: boolean;
  readonly?: boolean;
  lossAssessmentRecord?: CaseMoneyApi.TbCaseMoneyDetails | null;
  refreshKey?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isFirstItem: false,
  commentRecords: () => [],

  peifuRecords: () => [],
  finalRecords: () => [],
  readonly: false,
  lossAssessmentRecord: null,
  refreshKey: 0,
});
const emit = defineEmits([
  'openValueAssessment',
  'openLossAssessment',
  'openNegotiation',
  'openNegotiationTable',
  'openInsuranceDocking',
  'openDockingModal',
  'openCompensation',
  'viewAccidentInfo',
  'updateNegotiationTime',
  'refresh',
]);

watch(
  () => props.refreshKey,
  () => {
    hasDealData.value = true;
  },
);

// ... (existing code)

const handleTableLatestTime = (time: number, index: number) => {
  if (index === 0) {
    emit('updateNegotiationTime', time);
  }
};

const ChevronRight = createIconifyIcon('ep:arrow-right');
const AntdEditOutlined = createIconifyIcon('ant-design:edit-outlined');
const Plus = createIconifyIcon('ep:plus');

// Track if deal history has data - 默认为true以便组件先渲染
const hasDealData = ref(true);
const handleDealDataChange = (hasData: boolean) => {
  hasDealData.value = hasData;
};

// 格式化时间戳
const formatTimestamp = (timestamp: number | string) => {
  const date = new Date(Number(timestamp));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const handleExportImages = async (record: TbCaseComment) => {
  if (!record.id) return;
  const msgInstance = ElMessage({
    message: '正在准备下载，请稍候...',
    duration: 0,
    type: 'info',
  });

  try {
    // 1. Fetch all posts to get all attachments
    const res = await getCaseCommentPostListApi({
      tid: record.id,
      page: 1,
      size: 100, // Fetch enough to cover most cases
    });
    const posts = res.list || [];

    // 2. Collect all image URLs
    const images: { name: string; url: string }[] = [];
    posts.forEach((post) => {
      if (post.attatchs) {
        try {
          const files = JSON.parse(post.attatchs);
          if (Array.isArray(files)) {
            files.forEach((file: any) => {
              if (file.url) {
                images.push({
                  name: file.title || `image-${Date.now()}-${images.length}`,
                  url: file.url,
                });
              }
            });
          }
        } catch {
          // ignore parse error
        }
      }
    });

    if (images.length === 0) {
      msgInstance.close();
      ElMessage.warning('该对接记录暂无图像附件');
      return;
    }

    // 3. Zip and download
    const zip = new JSZip();
    const folder = zip.folder(`保司对接-${record.id}-图像资料`);

    const promises = images.map((img, index) => {
      return fetch(img.url)
        .then((response) => response.blob())
        .then((blob) => {
          // Handle filename extension
          let fileName = img.name;
          if (!fileName.includes('.')) {
            const type = blob.type.split('/')[1] || 'jpg';
            fileName = `${fileName}.${type}`;
          }
          // Ensure unique names if duplicates exist
          if (folder?.file(fileName)) {
            fileName = `${index}_${fileName}`;
          }
          folder?.file(fileName, blob);
        })
        .catch((error) => {
          console.error(`Failed to download ${img.url}`, error);
        });
    });

    await Promise.all(promises);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `保司对接-${record.id}-图像资料.zip`);

    msgInstance.close();
    ElMessage.success('下载完成');
  } catch (error) {
    console.error('Export images failed:', error);
    msgInstance.close();
    ElMessage.error('下载失败，请稍后重试');
  }
};

// Derived checks for content types
// Show insurance docking if item has cid OR if there are comment records
const showInsuranceDocking = computed(() => {
  return (
    !!props.item.cid ||
    (props.commentRecords && props.commentRecords.length > 0)
  );
});
const showNegotiation = computed(() => {
  return (
    !!props.item.pid || (props.peifuRecords && props.peifuRecords.length > 0)
  );
});
const showFinalPayment = computed(() => {
  return (
    !!props.item.fid || (props.peifuRecords && props.peifuRecords.length > 0)
  );
});

// Mock logic for "Update Info" or "Loss Table"
// We assume if there are specific keywords in remark or attached files, we might show them.
// For now, we leave them dependent on data existence if possible, or omit if strictly bound to deleted static states.
const showLossTable = computed(() => {
  // Expanded logic:
  // 1. If role is '定损' (DingSun), show it if we have data OR it's a legacy locked item.
  // 2. If it is the FIRST item (latest), and we have data, we should show the latest status regardless of who is viewing it (e.g. Admin).
  const isDingSunRole = props.item.roleName?.includes('定损');
  const hasData = !!props.lossAssessmentRecord;

  if (props.isFirstItem && hasData) return true;

  return isDingSunRole && (hasData || !props.item.unlockTime);
});

const lossTotalAmount = computed(() => {
  if (!props.lossAssessmentRecord?.zts) return 0;
  return props.lossAssessmentRecord.zts.reduce((sum, cate) => {
    return sum + (Number(cate.money) || 0);
  }, 0);
});

const lossBreakdown = computed(() => {
  if (
    !props.lossAssessmentRecord?.items ||
    props.lossAssessmentRecord.items.length === 0
  ) {
    return [];
  }

  // Group by Subject (zt ID)
  // Rider has isqishou=1. Third parties have zt=...
  // We can use a Map<string, {name, medical, property}>
  // 1. Build Subject Map from zts (using id -> name)
  const subjectMap = new Map<string, string>();

  // Helper to add to map
  const addToMap = (source: any[]) => {
    if (!source) return;
    source.forEach((subject) => {
      const idStr = String(subject.id || '');
      if (idStr) {
        const role = subject.ztName || subject.zt || '主体';
        let realName = subject.username || subject.name || '';

        // If Role is 'Rider', ensure we have the main rider name
        if (role.includes('骑手') && props.caseForm?.name) {
          realName = props.caseForm.name;
        }

        // Format: Role RealName (e.g., 骑手 张三, 三者 李四)
        const fullName = `${role} ${realName}`.trim();

        // Update map if new name seems more complete or just set it
        const existing = subjectMap.get(idStr);
        if (!existing || existing.length < fullName.length) {
          subjectMap.set(idStr, fullName);
        }
      }
    });
  };

  // Load from Case Form (likely contains real names)
  if (props.caseForm?.zts) {
    addToMap(props.caseForm.zts);
  }

  // Load from Money Record (might contain fallback or same info)
  if (props.lossAssessmentRecord.zts) {
    addToMap(props.lossAssessmentRecord.zts);
  }

  // 2. Group by Subject (zt ID) -> Category (catename)
  const subjectGroups = new Map<
    string,
    { categories: Map<string, number>; name: string }
  >();

  props.lossAssessmentRecord.items.forEach((item) => {
    const ztId = String(item.zt || '');
    if (!ztId && item.isqishou !== 1) return; // Skip if no ID and not rider?

    // Determine Subject Name
    let subjectName = '';

    if (item.isqishou === 1) {
      // Force Rider Format
      const riderName = props.caseForm?.name || '';
      subjectName = `骑手 ${riderName}`.trim();
    } else {
      // Third Party Lookup
      if (ztId && subjectMap.has(ztId)) {
        subjectName = subjectMap.get(ztId)!;
      } else {
        // Fallback
        const role = item.ztName || '未知主体';
        subjectName = role;
      }
    }

    // Use ztId as key, or 'rider' if it's the rider and no ZT ID
    const groupKey = ztId || 'rider';

    if (!subjectGroups.has(groupKey)) {
      subjectGroups.set(groupKey, { categories: new Map(), name: subjectName });
    }
    const group = subjectGroups.get(groupKey)!;

    // If we found a better name later (e.g. from zt map lookup vs earlier fallback), update it?
    // Actually we do lookup every time. But group entry is created once.
    // Let's ensure if we initially set "Unknown" but later find "Name", we update it.
    // But since we lookup properly first, iteration order shouldn't matter too much unless map was incomplete.
    // However, keeping consistent name is good.
    if (
      subjectName &&
      group.name !== subjectName &&
      group.name === '未知主体'
    ) {
      group.name = subjectName;
    }

    // Determine Category Name
    const catName = item.catename || '其他项目';

    // Calculate Amount
    const amount =
      (Number(item.moneryMain) || 0) + (Number(item.moneryAttach) || 0);

    const currentCatAmount = group.categories.get(catName) || 0;
    group.categories.set(catName, currentCatAmount + amount);
  });

  // 3. Transform to Array
  return [...subjectGroups.values()]
    .map((group) => {
      const categoryDetailsValues = [...group.categories.entries()]
        .filter(([_, val]) => val > 0)
        .map(([catName, val]) => `${catName}合计 ${val}元`);

      return {
        name: group.name,
        details: categoryDetailsValues.join(' '),
      };
    })
    .filter((g) => g.details.length > 0);
});

const showNoData = computed(() => {
  const { cid, fid, pid } = props.item;
  const hasRecords = props.commentRecords && props.commentRecords.length > 0;
  const hasPeifu = props.peifuRecords && props.peifuRecords.length > 0;
  // If we are showing the Loss Table, we definitely have data (or are in a state that is not "No Data")
  if (showLossTable.value) return false;
  // If we have deal history, don't show "No Data"
  if (hasDealData.value) return false;

  return !cid && !pid && !fid && !hasRecords && !hasPeifu;
});
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

      // Sort keys to ensure order tp_0, tp_1...
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
    console.warn('Failed to parse zeren for display', error);
  }

  return getLabelFromValue(zeren, LiabilityOptions);
});
const letterModalVisible = ref(false);
const letterContent = ref('');
const letterReadonly = ref(false);
const currentEditingRecord = ref<null | TbCaseFinal>(null);

// Voucher upload modal ref
const voucherModalRef = ref();

const handleGenerateLetter = (record?: TbCaseFinal) => {
  currentEditingRecord.value = record || null;
  letterReadonly.value = false;
  const dateStr =
    (props.caseForm?.insureTime
      ? formatTimestamp(props.caseForm.insureTime).split(' ')[0]
      : undefined) ?? '____-____-____';
  const [year, month, day] = dateStr.split('-');

  // Parse Liability
  const zeren = props.lossAssessmentRecord?.zeren;
  let riderName = props.caseForm?.name || '骑手';

  // Attempt to find rider name from zts if available, or fallback
  const riderZt = props.lossAssessmentRecord?.zts?.find(
    (z) => z.ztName === '骑手',
  );
  if (riderZt && riderZt.username) riderName = riderZt.username;

  let riderLiability = '未知';
  const tpList: { liability: string; name: string }[] = [];

  try {
    if (zeren && zeren.startsWith('{')) {
      const zerenObj = JSON.parse(zeren);
      riderLiability =
        getLabelFromValue(zerenObj.rider, LiabilityOptions) || '未知';

      const tpKeys = Object.keys(zerenObj)
        .filter((k) => k.startsWith('tp_'))
        .toSorted((a, b) => {
          const idxA = Number(a.split('_')[1]);
          const idxB = Number(b.split('_')[1]);
          return idxA - idxB;
        });

      tpKeys.forEach((key, idx) => {
        // Try to get real name from zts data
        let name = `三者${idx + 1}`;
        const ztsData = props.lossAssessmentRecord?.zts || props.caseForm?.zts;
        if (ztsData && Array.isArray(ztsData)) {
          // Filter out rider and get third parties
          const thirdParties = ztsData.filter((z: any) => z.ztName !== '骑手');
          if (thirdParties[idx] && thirdParties[idx].username) {
            name = thirdParties[idx].username;
          }
        }

        // Fallback: try to get from finalRecords
        if (
          name.startsWith('三者') &&
          props.finalRecords &&
          props.finalRecords.length > 0
        ) {
          const thirdPartyRecords = props.finalRecords.filter(
            (r) => r.ztName !== '骑手' && r.ztName?.includes('三者'),
          );
          if (thirdPartyRecords[idx] && thirdPartyRecords[idx].ztUsername) {
            name = thirdPartyRecords[idx].ztUsername;
          }
        }

        tpList.push({
          name,
          liability:
            getLabelFromValue(zerenObj[key], LiabilityOptions) || '未知',
        });
      });
    } else if (zeren) {
      riderLiability = getLabelFromValue(zeren, LiabilityOptions);
    } else if (!zeren && props.finalRecords && props.finalRecords.length > 0) {
      // Fallback: when no zeren data, build from finalRecords
      const thirdPartyRecords = props.finalRecords.filter(
        (r) => r.ztName !== '骑手' && r.ztName?.includes('三者'),
      );
      thirdPartyRecords.forEach((record) => {
        tpList.push({
          name: record.ztUsername || record.ztName || '未知',
          liability: '未知',
        });
      });
    }
  } catch (error) {
    console.error(error);
  }

  // Construct Text
  const lines: string[] = [
    `事故时间：${year}年${Number(month)}月${Number(day)}日`,
    `骑手方：${riderName}（责任：${riderLiability}）`,
    ...tpList.map((tp) => `三者方：${tp.name}（责任：${tp.liability})`),
    '',
    `现骑手方${riderName}${tpList.length > 0 ? '、' : ''}${tpList.map((t) => `三者方${t.name}`).join('、')}就此事故协商一致，进行了结：`,
    '',

    `骑手方${riderName} ________ 费用花费________元，保险公司最终赔付金额为________元。`,
  ];

  // Add rider payment info

  // Add third party payment info
  tpList.forEach((tp) => {
    lines.push(
      `三者方${tp.name} ________ 费用花费________元，保险公司最终赔付金额为________元。`,
    );
  });

  lines.push(
    '',
    '骑手方保险公司支付完毕后，甲乙双方不再对甲方保险公司进行索赔，甲方和甲方保险公司也不再承担本次事故任何赔偿责任。',
    '',
    '',
    '骑手方保险公司支付完毕后，甲乙双方不再对甲方保险公司进行索赔，甲方和甲方保险公司也不再承担本次事故任何赔偿责任。',
    '',
    `骑手方同意授权保险公司将理赔款________元支付到________指定账户：`,
    '户名：________',
    '卡号：________',
    '开户行：________',
    '',
    '请仔细阅读此内容，无纠纷同意赔款金额后确认结案。若同意并知情以上内容，请发名字+"确认同意"',
  );

  letterContent.value = lines.join('\n');
  letterModalVisible.value = true;
};

const handleSaveLetter = async (letterText: string) => {
  if (!currentEditingRecord.value?.id) {
    ElMessage.error('无法保存：未找到对应的赔付记录');
    return;
  }

  try {
    await updateCaseFinalApi({
      id: currentEditingRecord.value.id,
      caseId: props.caseForm?.id || props.caseForm?.caseId,
      lisuanshu: letterText,
    });
    ElMessage.success('理算书更新成功');
    letterModalVisible.value = false;
    emit('refresh');
  } catch (error) {
    console.error('Save letter failed:', error);
    ElMessage.error('理算书更新失败');
  }
};

const handleViewLetter = (record?: TbCaseFinal) => {
  handleGenerateLetter(record);
  letterReadonly.value = true;
};

// 赔付凭证上传 - 打开弹窗
const handleVoucherUpload = (record: TbCaseFinal) => {
  voucherModalRef.value?.modalApi.setData({
    record,
    caseId: props.caseForm?.id || props.caseForm?.caseId,
  });
  voucherModalRef.value?.modalApi.open();
};

// Parse attachments JSON string
const parseAttachments = (attatchsStr?: string) => {
  if (!attatchsStr) return [];
  try {
    const parsed = JSON.parse(attatchsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Check if file is image
const isImage = (url?: string) => {
  if (!url) return false;
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.svg',
  ];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
};
</script>

<template>
  <div class="space-y-4 px-2">
    <!-- Timeline Deal History Section -->
    <div
      v-if="item.id && hasDealData"
      class="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
    >
      <div
        class="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-2">
          <div class="h-4 w-1 rounded bg-blue-500"></div>
          <span class="font-bold text-gray-800 dark:text-gray-100"
            >基础信息修改历史</span
          >
        </div>
        <ElButton
          size="small"
          class="w-full !border-gray-200 !bg-gray-50 shadow-sm hover:!border-blue-300 hover:!text-blue-600 sm:w-auto dark:!border-gray-700 dark:!bg-slate-800 dark:!text-gray-200"
          @click="emit('viewAccidentInfo')"
        >
          查看更新后完整案件基础信息
          <ElIcon class="ml-1"><ChevronRight /></ElIcon>
        </ElButton>
      </div>
      <TimelineDealHistory
        :key="refreshKey"
        :timeline-id="item.id"
        @has-data="handleDealDataChange"
      />
    </div>

    <!-- Loss Table Section (Previously in static cards 3 & 4) -->
    <div
      v-if="showLossTable"
      class="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
    >
      <div
        class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3"
      >
        <div
          class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100"
        >
          <div class="h-4 w-1 rounded bg-green-500"></div>
          定损表 {{ caseForm?.id }}-{{ lossAssessmentRecord?.id }}
        </div>
        <div class="flex items-center gap-2">
          <ElButton
            v-if="lossAssessmentRecord"
            size="small"
            class="!border-gray-200 !bg-gray-50 shadow-sm hover:!border-blue-300 hover:!text-blue-600 dark:!border-gray-700 dark:!bg-slate-800 dark:!text-gray-200"
            @click="emit('openLossAssessment')"
          >
            {{ readonly ? '查看出险判定表' : '修改出险判定表' }}
            <ElIcon class="ml-1"><ChevronRight /></ElIcon>
          </ElButton>
          <ElButton
            v-if="lossAssessmentRecord"
            size="small"
            class="!border-gray-200 !bg-gray-50 shadow-sm hover:!border-blue-300 hover:!text-blue-600 dark:!border-gray-700 dark:!bg-slate-800 dark:!text-gray-200"
            @click="emit('openValueAssessment')"
          >
            {{ readonly ? '查看损失价值计算表' : '修改损失价值计算表' }}
            <ElIcon class="ml-1"><ChevronRight /></ElIcon>
          </ElButton>
        </div>
      </div>
      <div class="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
        <span
          class="rounded-md bg-gray-50 px-3 py-1 font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:ring-gray-600"
          v-if="lossAssessmentRecord?.types"
        >
          事故类型：{{
            getLabelsFromValues(lossAssessmentRecord.types, AccidentTypeOptions)
          }}
        </span>
        <span
          class="rounded-md bg-gray-50 px-3 py-1 font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:ring-gray-600"
          v-if="lossAssessmentRecord?.zeren"
        >
          责任类型：{{ formattedZeren }}
        </span>
        <span
          class="rounded-md bg-gray-50 px-3 py-1 font-medium text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:ring-gray-600"
          v-if="lossAssessmentRecord?.panding"
        >
          特殊判定：{{
            getLabelsFromValues(
              lossAssessmentRecord.panding,
              SpecialDeterminationOptions,
            )
          }}
        </span>
      </div>
      <div
        class="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400"
        v-if="lossBreakdown && lossBreakdown.length > 0"
      >
        <div class="mb-1 font-medium">损失价值计算：</div>
        <div v-for="(detail, index) in lossBreakdown" :key="index" class="ml-4">
          {{ detail.name }} {{ detail.details }}
        </div>
      </div>
      <div
        class="flex items-center justify-end font-medium text-gray-900 dark:text-gray-100"
        v-if="lossTotalAmount > 0"
      >
        应赔付总金额：
        <span class="ml-2 text-xl font-bold text-red-600">
          {{ lossTotalAmount }}
        </span>
      </div>
    </div>

    <!-- Insurance Docking Tables - Each record is independent -->
    <div v-if="showInsuranceDocking">
      <template v-if="props.commentRecords && props.commentRecords.length > 0">
        <!-- Loop through records, each gets its own complete table -->
        <div
          v-for="(record, idx) in props.commentRecords"
          :key="record.id || idx"
          class="mb-4 overflow-hidden rounded-lg border border-gray-200 shadow-sm last:mb-0 dark:border-gray-700"
        >
          <!-- Table Header - unique for each record -->
          <div
            class="flex flex-col items-start gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 dark:border-gray-700 dark:bg-slate-800"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-base font-bold text-gray-900 dark:text-gray-100"
              >
                保司对接表 {{ caseForm?.id }}-{{ record.id }}
              </span>
            </div>

            <div
              class="flex w-full flex-col gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:px-4 dark:bg-slate-700"
            >
              <div
                class="flex items-start justify-between sm:items-center sm:justify-start sm:gap-2"
              >
                <div class="flex flex-1 items-start gap-2 overflow-hidden">
                  <span
                    class="whitespace-nowrap text-gray-500 dark:text-gray-400"
                    >保单号</span
                  >
                  <span
                    class="break-all font-medium text-gray-900 dark:text-gray-100"
                    >{{ record.policyNo || caseForm?.policyNo || '---' }}</span
                  >
                </div>
                <span
                  class="ml-2 shrink-0 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 sm:hidden"
                >
                  {{
                    record.type === '1'
                      ? '主险'
                      : record.type === '2'
                        ? '附加险'
                        : '主险'
                  }}
                </span>
              </div>

              <div class="hidden h-3 w-px bg-gray-300 sm:block"></div>
              <div class="hidden items-center gap-2 sm:flex">
                <span
                  class="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600"
                >
                  {{
                    record.type === '1'
                      ? '主险'
                      : record.type === '2'
                        ? '附加险'
                        : '主险'
                  }}
                </span>
              </div>
              <div class="hidden h-3 w-px bg-gray-300 sm:block"></div>

              <div class="flex items-center gap-2">
                <span class="text-gray-500 dark:text-gray-400">对接人</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ record.company || caseForm?.companyName || '---' }}
                  {{ record.lipei || caseForm?.lipeiPerson || '---' }}
                </span>
              </div>

              <div
                class="flex items-center justify-between sm:justify-start sm:gap-4"
              >
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">{{
                    record.phone || caseForm?.phone || '---'
                  }}</span>
                  <span class="text-gray-400">{{
                    record.email || '邮箱'
                  }}</span>
                </div>
                <div
                  v-if="isFirstItem && !readonly"
                  class="ml-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                  @click.stop="emit('openInsuranceDocking', record)"
                >
                  <ElIcon><AntdEditOutlined /></ElIcon>
                </div>
              </div>
            </div>
          </div>

          <!-- Table Content -->
          <DockingPostTable :comment-data="record" />

          <!-- Action Buttons - show on all records if it is the first timeline item -->
          <div
            v-if="isFirstItem && !readonly"
            class="flex flex-wrap gap-4 bg-gray-50 p-3 font-medium text-blue-600 dark:bg-slate-800"
          >
            <span
              class="flex cursor-pointer items-center transition-colors hover:text-blue-700 hover:underline"
              @click="emit('openDockingModal', record)"
            >
              <ElIcon class="mr-1"><Plus /></ElIcon> 添加对接
            </span>
            <span
              class="flex cursor-pointer items-center transition-colors hover:text-blue-700 hover:underline"
            >
              <ElIcon class="mr-1"><ChevronRight /></ElIcon>
              导出报损清单Excel
            </span>
            <span
              class="flex cursor-pointer items-center transition-colors hover:text-blue-700 hover:underline"
              @click="handleExportImages(record)"
            >
              <ElIcon class="mr-1"><ChevronRight /></ElIcon>
              导出图像材料
            </span>
          </div>
        </div>
      </template>

      <!-- No Records -->
      <div
        v-else
        class="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
      >
        <div class="flex h-20 items-center justify-center text-gray-400">
          暂无对接记录
        </div>
      </div>
    </div>

    <!-- No Data Placeholder -->
    <div
      v-if="showNoData"
      class="flex h-20 items-center justify-center text-gray-400"
    >
      无操作数据
    </div>

    <!-- Negotiation Record Table (Triggered by item.pid) -->
    <div v-if="showNegotiation">
      <template v-if="props.peifuRecords && props.peifuRecords.length > 0">
        <div
          v-for="(record, index) in props.peifuRecords"
          :key="record.id || index"
          class="mb-4 overflow-hidden rounded-lg border border-gray-200 shadow-sm last:mb-0 dark:border-gray-700"
        >
          <!-- Table Header -->
          <div
            class="flex flex-col items-start gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 dark:border-gray-700 dark:bg-slate-800"
          >
            <div class="flex items-center gap-3">
              <span
                class="text-base font-bold text-gray-900 dark:text-gray-100"
              >
                赔付协商记录表 {{ caseForm?.id }}-{{ record.id }}
              </span>
            </div>

            <div
              class="flex w-full flex-col gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:px-4 dark:bg-slate-700"
            >
              <div
                class="flex items-center gap-2 text-gray-500 dark:text-gray-400"
              >
                <span>主体：{{ record.ztName || '---' }}</span>
                <span>{{ record.ztUsername || '' }}</span>
                <span>{{ record.ztPhone || '' }}</span>
              </div>

              <div
                v-if="isFirstItem && index === 0 && !readonly"
                class="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600 sm:ml-2"
                @click.stop="emit('openNegotiationTable', record)"
              >
                <ElIcon><AntdEditOutlined /></ElIcon>
              </div>
            </div>
          </div>
          <!-- Table Content -->
          <CompensationPostTable
            :comment-data="record"
            @latest-time="(t) => handleTableLatestTime(t, index)"
          />

          <!-- Action logic for adding new posts -->
          <div
            v-if="isFirstItem && !readonly"
            class="bg-gray-50 p-3 dark:bg-slate-800"
          >
            <span
              class="flex cursor-pointer items-center text-blue-700 transition-colors hover:underline"
              @click="emit('openNegotiation', record)"
            >
              <ElIcon class="mr-1"><Plus /></ElIcon> 添加协商
            </span>
          </div>
        </div>
      </template>

      <!-- No Records -->
      <div
        v-else
        class="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-800"
        >
          <div class="flex items-center gap-4">
            <span class="font-bold text-gray-800 dark:text-gray-100">
              赔付协商记录表 {{ caseForm?.id }}-{{ item.pid }}
            </span>
          </div>
        </div>
        <div class="flex h-20 items-center justify-center text-gray-400">
          暂无协商记录
        </div>
      </div>
    </div>

    <!-- Final Compensation Area (Triggered by item.fid) -->
    <div
      v-if="showFinalPayment"
      class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-slate-800"
    >
      <div class="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <div class="h-4 w-1 rounded bg-purple-500"></div>
        <span class="font-bold text-gray-800 dark:text-gray-100"
          >最终赔付区</span
        >
        <span
          v-if="!readonly"
          class="ml-2 cursor-pointer text-sm text-blue-600 hover:underline"
          @click="emit('openCompensation')"
        >
          +添加
        </span>
      </div>

      <!-- 显示列表 -->
      <div v-if="props.finalRecords && props.finalRecords.length > 0">
        <div
          v-for="(record, idx) in props.finalRecords"
          :key="record.id || idx"
          class="mb-4 flex flex-wrap items-center gap-6 border-b border-gray-100 pb-4 text-sm last:mb-0 last:border-b-0"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400">赔付主体</span>
            <span class="font-medium text-gray-700">{{
              record.ztName || '--'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400"> 最终赔付金额 </span>
            <span class="font-medium text-gray-700">{{
              record.moneyMain || '--'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400"> 收款银行卡户名 </span>
            <span class="font-medium text-gray-700">{{
              record.ztUsername || '--'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400"> 收款银行卡卡号 </span>
            <span class="font-medium text-gray-700">{{
              record.card || '--'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400"> 收款银行卡机构名 </span>
            <span class="font-medium text-gray-700">{{
              record.bank || '--'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400"> 付款开始时间 </span>
            <span class="font-medium text-gray-700">{{
              record.beginTime ? formatTimestamp(record.beginTime) : '--'
            }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-400"> 赔付到账时间 </span>
            <span class="font-medium text-gray-700">{{
              record.endTime ? formatTimestamp(record.endTime) : '--'
            }}</span>
          </div>

          <div v-if="!readonly" class="ml-auto flex gap-3 text-blue-600">
            <span
              class="cursor-pointer hover:underline"
              @click="() => handleGenerateLetter(record)"
            >
              生成理算确认书
            </span>
            <span
              class="cursor-pointer hover:underline"
              @click="() => handleVoucherUpload(record)"
            >
              赔付凭证上传
            </span>
            <span class="cursor-pointer hover:underline"> 编辑 </span>
          </div>
          <div v-else class="ml-auto flex gap-3 text-blue-600">
            <span
              class="cursor-pointer hover:underline"
              @click="() => handleViewLetter(record)"
            >
              查看理算确认书
            </span>
          </div>

          <!-- 附件展示区域 -->
          <div
            v-if="parseAttachments(record.attatchs).length > 0"
            class="mt-1 w-full"
          >
            <div class="mb-2 text-xs text-gray-500">赔付凭证：</div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(attachment, attachIdx) in parseAttachments(
                  record.attatchs,
                )"
                :key="attachIdx"
                class="relative overflow-hidden rounded border border-gray-200"
              >
                <!-- 图片缩略图 -->
                <a
                  v-if="isImage(attachment.url)"
                  :href="attachment.url"
                  target="_blank"
                  class="block"
                >
                  <img
                    :src="attachment.url"
                    :alt="attachment.name"
                    class="h-20 w-20 object-cover transition-transform hover:scale-110"
                  />
                </a>
                <!-- PDF或其他文件图标 -->
                <a
                  v-else
                  :href="attachment.url"
                  target="_blank"
                  class="flex w-40 flex-col items-center justify-center rounded border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100"
                >
                  <ElIcon :size="32" class="text-blue-500">
                    <component :is="createIconifyIcon('mdi:file-document')" />
                  </ElIcon>
                  <span
                    class="mt-2 w-full break-all text-center text-xs text-gray-700"
                    :title="attachment.name"
                  >
                    {{ attachment.name }}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-else class="flex h-16 items-center justify-center text-gray-400">
        暂无最终赔付记录
      </div>
    </div>

    <AdjustmentLetterModal
      v-model="letterModalVisible"
      :content="letterContent"
      :readonly="letterReadonly"
      @save="handleSaveLetter"
    />

    <VoucherUploadModal ref="voucherModalRef" @success="emit('refresh')" />
  </div>
</template>
