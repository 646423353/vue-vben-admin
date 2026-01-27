<script lang="ts" setup>
import type { ExtendedVxeGridApi } from 'node_modules/@vben/plugins/src/vxe-table/types';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseMoneyApi } from '#/api/core/case-money';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCascader,
  ElDivider,
  ElInput,
  ElMessage,
  ElText,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  DingsunMoneyGetApi,
  DingsunMoneyUpdateApi,
} from '#/api/core/case-money';
import { CaseSetApi } from '#/api/core/case-set';

import ValueAssessmentDetailModal from './ValueAssessmentDetailModal.vue';
import ValueAssessmentThirdPartyGrid from './ValueAssessmentThirdPartyGrid.vue';

// Use TbCaseMoney from API
type ExtendedCaseMoney = CaseMoneyApi.TbCaseMoney;

const emit = defineEmits(['reCalculate']);
// Callback to refresh parent data
const onSuccessCallback = ref<(() => void) | null>(null);

const thirdPartyRefs = ref<any[]>([]); // Array of refs
const isRiderUpdatedModal = ref(false);
const isThreeUpdatedModal = ref(false);
const fileList = ref<Array<{ label: string; value: number | string }>>([]);
const caseId = ref<number | string>('');
const recordId = ref<number | string>(''); // Store the id returned from API

// Third Party Subjects
interface Subject {
  id: number | string;
  zt: string;
  username: string;
}
const thirdPartySubjects = ref<Subject[]>([]);
const thirdPartyDataMap = ref<Record<string, ExtendedCaseMoney[]>>({});
const threeSummaryTotal = ref(0);

// Cascader options for money type selection
interface CascaderOption {
  value: number;
  label: string;
  children?: CascaderOption[];
  title?: string;
  cate?: number; // Category id
  catename?: string; // Category name
  [key: string]: any; // Allow any additional properties
}
const moneyCascaderOptions = ref<CascaderOption[]>([]);
const selectedMoneyType = ref<number[]>([]);
// Store maps for quick lookup
const moneyTypeMap = ref<Map<number, string>>(new Map());
const moneyCateMap = ref<Map<number, { cate: number; catename: string }>>(
  new Map(),
);

// Helper to calculate summary (only for Rider now)
const calculateSummary = (data: ExtendedCaseMoney[]) => {
  let mainTotal = 0;
  let attachTotal = 0;
  let preTotal = 0;

  data.forEach((item) => {
    mainTotal += Number(item.moneryMain || 0);
    attachTotal += Number(item.moneryAttach || 0);
    preTotal += Number(item.moneryHope || 0);
  });

  return {
    mainTotal,
    attachTotal,
    preTotal,
    total: mainTotal + attachTotal,
  };
};

const riderSummary = ref({
  mainTotal: 0,
  attachTotal: 0,
  preTotal: 0,
  total: 0,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ValueAssessmentDetailModal,
});

const handleDetailCalc = (row: ExtendedCaseMoney) => {
  detailModalApi.setData({
    detailData: {
      csYiju: row.csYiju,
      gongshi: row.gongshi,
      comments: row.comments,
      pics: row.pics,
    },
    rowId: row.id,
    fileList: fileList.value,
    isReadonly: isRiderUpdatedModal.value || isThreeUpdatedModal.value,
    onSuccess: (result: any) => {
      Object.assign(row, {
        csYiju: result.csYiju,
        gongshi: result.gongshi,
        comments: result.comments,
        pics: result.pics,
        detailData: result.detailData,
      });
    },
  });
  detailModalApi.open();
};

const [Modal, modalApi] = useVbenModal({
  title: '损失价值计算表',
  class: 'w-[1000px]',
  onCancel() {
    caseId.value = '';
    modalApi.close();
  },
  async onConfirm() {
    const riderData = getRiderData() || [];
    const threeData: ExtendedCaseMoney[] = [];

    // Aggregate data from all third party grids
    if (thirdPartyRefs.value) {
      thirdPartyRefs.value.forEach((comp: any) => {
        if (comp && comp.getFullData) {
          threeData.push(...comp.getFullData());
        }
      });
    }

    const allItems = [...riderData, ...threeData];

    const payload = {
      id: caseId.value,
      items: allItems,
      details: {
        id: recordId.value,
      },
    };

    await DingsunMoneyUpdateApi(payload);
    ElMessage.success('保存成功');

    if (onSuccessCallback.value) {
      onSuccessCallback.value();
    }

    caseId.value = '';
    emit('reCalculate');
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      caseId.value = data.caseId;
      isRiderUpdatedModal.value = data.isRiderUpdated;
      isThreeUpdatedModal.value = data.isThreeUpdated;

      // 动态设置是否显示确认按钮
      const isReadonly = isRiderUpdatedModal.value || isThreeUpdatedModal.value;
      modalApi.setState({ showConfirmButton: !isReadonly });

      fileList.value = data.fileList || [];
      const zts = data.zts || [];

      // Filter Third Party Subjects
      thirdPartySubjects.value = zts.filter((item: any) => item.zt === '三者');

      if (data.onSuccess) {
        onSuccessCallback.value = data.onSuccess;
      }
      fetchData();
    } else {
      thirdPartyRefs.value = []; // Clear refs on close
    }
  },
});

const fetchData = async () => {
  if (!caseId.value) return;
  try {
    modalApi.setState({ loading: true });
    const res = await DingsunMoneyGetApi(caseId.value);
    recordId.value = res.id || ''; // Save the id from response
    const items = res.items || [];

    const riderItems = items.filter((item) => item.isqishou === 1);

    // Build third party data map in one go
    const newThirdPartyDataMap: Record<string, ExtendedCaseMoney[]> = {};

    // Initialize empty arrays for all subjects
    thirdPartySubjects.value.forEach((sub) => {
      newThirdPartyDataMap[sub.id] = [];
    });

    // Distribute third party items
    items
      .filter((item) => item.isqishou !== 1) // All non-rider items are third-party
      .forEach((item) => {
        if (!item.zt) return;
        const key = String(item.zt);
        if (!newThirdPartyDataMap[key]) {
          newThirdPartyDataMap[key] = [];
        }
        newThirdPartyDataMap[key].push(item);
      });

    // Single assignment to trigger reactive update
    thirdPartyDataMap.value = newThirdPartyDataMap;

    if (riderGridApi.grid) {
      riderGridApi.grid.reloadData(riderItems);
    }

    // Manually reload data for third party grids after fetchData
    setTimeout(() => {
      if (thirdPartyRefs.value && thirdPartyRefs.value.length > 0) {
        thirdPartyRefs.value.forEach((comp: any, index: number) => {
          if (comp && comp.reloadData) {
            const subject = thirdPartySubjects.value[index];
            if (subject) {
              const dataForSubject = thirdPartyDataMap.value[subject.id] || [];
              comp.reloadData(dataForSubject);
            }
          }
        });
      }
      // Update summaries after a longer delay to ensure all grids are loaded
      setTimeout(() => {
        updateSummaries();
      }, 100);
    }, 200);
  } catch (error) {
    console.error('Failed to fetch loss assessment data:', error);
  } finally {
    modalApi.setState({ loading: false });
  }
};

const updateSummaries = () => {
  const riderData = getRiderData() || [];
  riderSummary.value = calculateSummary(riderData);

  // Update total summary from refs
  let total = 0;
  if (thirdPartyRefs.value) {
    thirdPartyRefs.value.forEach((comp: any) => {
      if (comp && comp.getTotal) {
        total += Number(comp.getTotal() || 0);
      }
    });
  }
  threeSummaryTotal.value = total;
};

const commonColumns = [
  {
    field: 'type',
    title: '分类',
    width: 120,
    formatter: ({ row }: { row: ExtendedCaseMoney }) => {
      const typeMap: Record<number, string> = {
        1: '医保内医疗',
        2: '医保外医疗',
        3: '骑手伤残金',
        4: '骑手死亡金',
        5: '被扶养人生活费',
        6: '丧葬费',
        7: '后续医疗费',
        8: '住院津贴',
        9: '误工费',
        10: '生活保障金',
        11: '护理费',
        12: '营养费',
        13: '机动车车损',
        14: '物损',
      };
      // Prioritize typename if available, otherwise use typeMap
      return row.typename || (row.type && typeMap[row.type]) || '未知';
    },
  },
  {
    field: 'moneryHope',
    editRender: {},
    slots: { edit: 'edit_moneryHope' },
    title: '预报损金额',
    width: 120,
  },
  {
    field: 'moneryMain',
    editRender: {},
    slots: { edit: 'edit_moneryMain' },
    title: '主险定损金额',
    width: 120,
  },
  {
    field: 'moneryAttach',
    editRender: {},
    slots: { edit: 'edit_moneryAttach' },
    title: '附加险定损金额',
    width: 130,
  },
  {
    field: 'yiju',
    editRender: {},
    slots: { edit: 'edit_yiju' },
    title: '定损计算说明',
    minWidth: 180,
  },
  {
    title: '详细测算表',
    width: 120,
    slots: { default: 'detail_action' },
  },
  {
    title: '操作',
    width: 80,
    slots: { default: 'action' },
  },
];

const riderGridOptions: VxeGridProps<ExtendedCaseMoney> = {
  columns: commonColumns,
  pagerConfig: { enabled: false },
  sortConfig: { multiple: true },
  toolbarConfig: { slots: { buttons: 'toolbar_buttons' } },
  // 根据只读状态禁用编辑
  editConfig: {
    mode: 'row',
    trigger: 'click',
    autoClear: false,
    enabled: computed(() => !isRiderUpdatedModal.value),
  } as any,
};

const [RiderGrid, riderGridApi] = useVbenVxeGrid({
  gridOptions: riderGridOptions as any,
});

const pushEvent = async (
  gridRef: ExtendedVxeGridApi,
  type: number,
  category: 1 | 2,
  typename?: string,
  cate?: number,
  catename?: string,
) => {
  const $grid = gridRef.grid;
  if ($grid) {
    const record: ExtendedCaseMoney = {
      caseId: caseId.value,
      type,
      typename: typename || '',
      cate: cate || 0,
      catename: catename || '',
      moneryHope: '',
      moneryMain: '',
      moneryAttach: '',
      yiju: '',
      isqishou: category,
      zt: category === 2 ? undefined : category,
      ztName: category === 1 ? '骑手' : '三者',
      pics: '',
    } as any;
    const { row: newRow } = await $grid.insertAt(record, -1);
    $grid.setEditRow(newRow);
    updateSummaries();
  }
};

const removeRow = async (
  row: ExtendedCaseMoney,
  gridRef: ExtendedVxeGridApi,
) => {
  const $grid = gridRef.grid;
  if ($grid) {
    await $grid.remove(row);
    updateSummaries();
  }
};

const loadMoneyCascaderData = async () => {
  try {
    // Get categories
    const categories = await CaseSetApi.getMoneyCateList();

    // For each category, get its items
    const cascaderData: CascaderOption[] = [];
    const typeMap = new Map<number, string>();
    const cateMap = new Map<number, { cate: number; catename: string }>();

    for (const category of categories) {
      const items = await CaseSetApi.getMoneyItems({ cateId: category.id! });
      const categoryInfo = {
        cate: category.id!,
        catename: category.title || '',
      };

      cascaderData.push({
        value: category.id!,
        label: category.title || '',
        children: items.map((item) => {
          // Store title and category info in maps
          typeMap.set(item.id!, item.title || '');
          cateMap.set(item.id!, categoryInfo);
          return {
            value: item.id!,
            label: item.title || '',
            title: item.title,
            cate: category.id!,
            catename: category.title,
          };
        }),
      });
    }

    moneyCascaderOptions.value = cascaderData;
    moneyTypeMap.value = typeMap;
    moneyCateMap.value = cateMap;
  } catch (error) {
    console.error('Failed to load money cascader data:', error);
    ElMessage.error('加载项目分类失败');
  }
};

const handleMoneyTypeSelect = (value: any) => {
  const values = value as number[];
  if (values && Array.isArray(values) && values.length === 2) {
    // values[0] is category id, values[1] is item id
    const typeId = values[1];
    if (!typeId) return;

    const typeName = moneyTypeMap.value.get(typeId) || '';
    const cateInfo = moneyCateMap.value.get(typeId);
    pushEvent(
      riderGridApi,
      typeId,
      1,
      typeName,
      cateInfo?.cate,
      cateInfo?.catename,
    );
    selectedMoneyType.value = [];
  }
};

const getRiderData = () => riderGridApi.grid?.getFullData();

const handleInput = () => {
  updateSummaries();
};

// Load cascader data on mount
onMounted(() => {
  loadMoneyCascaderData();
});
</script>

<template>
  <Modal>
    <DetailModal />
    <div class="px-4 pb-4">
      <!-- Rider Section -->
      <div class="mb-6">
        <RiderGrid @checkbox-change="updateSummaries">
          <template #toolbar_buttons>
            <div class="flex items-center gap-4">
              <ElText class="text-lg font-bold"> 骑手明细 </ElText>
              <div class="space-x-4 text-sm text-gray-600">
                <span>预报损总计: {{ riderSummary.preTotal }}</span>
                <span>主险总计: {{ riderSummary.mainTotal }}</span>
                <span>附加险总计: {{ riderSummary.attachTotal }}</span>
                <span class="font-bold text-red-600"
                  >总计: {{ riderSummary.total }}</span
                >
              </div>
            </div>
          </template>

          <template #toolbar-tools>
            <ElCascader
              v-if="!isRiderUpdatedModal"
              v-model="selectedMoneyType"
              :options="moneyCascaderOptions"
              placeholder="请选择项目进行添加"
              :props="{
                expandTrigger: 'hover',
                value: 'value',
                label: 'label',
              }"
              @change="handleMoneyTypeSelect"
              clearable
              filterable
              size="small"
            />
          </template>

          <template #edit_moneryHope="{ row }">
            <ElInput
              v-model="row.moneryHope"
              type="number"
              placeholder="请输入"
              @input="handleInput"
            />
          </template>
          <template #edit_moneryMain="{ row }">
            <ElInput
              v-model="row.moneryMain"
              type="number"
              placeholder="请输入"
              @input="handleInput"
            />
          </template>
          <template #edit_moneryAttach="{ row }">
            <ElInput
              v-model="row.moneryAttach"
              type="number"
              placeholder="请输入"
              @input="handleInput"
            />
          </template>
          <template #edit_yiju="{ row }">
            <ElInput v-model="row.yiju" placeholder="请输入说明" />
          </template>

          <template #detail_action="{ row }">
            <ElButton
              v-if="
                row.detailData ||
                row.csYiju ||
                row.gongshi ||
                row.comments ||
                row.pics
              "
              link
              type="primary"
              size="small"
              @click="handleDetailCalc(row)"
            >
              {{ isRiderUpdatedModal ? '查看明细' : '编辑明细' }}
            </ElButton>
            <ElButton
              v-else-if="!isRiderUpdatedModal"
              link
              type="primary"
              size="small"
              @click="handleDetailCalc(row)"
            >
              + 添加明细
            </ElButton>
          </template>

          <template #action="{ row }">
            <ElButton
              v-if="!isRiderUpdatedModal"
              link
              type="danger"
              size="small"
              @click="removeRow(row, riderGridApi)"
              >删除</ElButton
            >
          </template>
        </RiderGrid>
      </div>

      <ElDivider />

      <!-- Third Party Sections -->
      <div
        v-for="(subject, index) in thirdPartySubjects"
        :key="subject.id"
        class="mb-6"
      >
        <ValueAssessmentThirdPartyGrid
          ref="thirdPartyRefs"
          :items="thirdPartyDataMap[subject.id] || []"
          :subject-id="subject.id"
          :subject-name="`三者明细 - ${subject.username || '未知'}`"
          :case-id="caseId"
          :cascader-options="moneyCascaderOptions"
          :money-type-map="moneyTypeMap"
          :money-cate-map="moneyCateMap"
          :is-readonly="isThreeUpdatedModal"
          @update-summaries="updateSummaries"
          @check-detail="handleDetailCalc"
        />
        <ElDivider v-if="index < thirdPartySubjects.length - 1" />
      </div>

      <div
        v-if="thirdPartySubjects.length === 0"
        class="py-4 text-center text-gray-400"
      >
        无三者信息
      </div>

      <div class="mt-4 border-t pt-4 text-right">
        <div class="text-xl font-bold">
          总计赔付金额:
          <span class="text-red-600">{{
            riderSummary.total + threeSummaryTotal
          }}</span>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-form-item .el-date-editor) {
  width: 100%;
}

:global(.money-dropdown-popper) {
  max-height: 45vh;
  overflow-y: auto;
}

:global(.money-dropdown-popper .el-dropdown-menu) {
  max-height: 45vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
