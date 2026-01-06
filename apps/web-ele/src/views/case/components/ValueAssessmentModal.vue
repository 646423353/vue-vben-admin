<script lang="ts" setup>
import type { ExtendedVxeGridApi } from 'node_modules/@vben/plugins/src/vxe-table/types';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseApi } from '#/api/core/case';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AntdPlusOutlined } from '@vben/icons';

import {
  ElButton,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElInput,
  ElMessage,
  ElText,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  CaseMoneyAddApi,
  CaseMoneyListApi,
  CaseMoneyUpdateApi,
} from '#/api/core/case';

import ValueAssessmentDetailModal from './ValueAssessmentDetailModal.vue';

// Extend the type locally to support new fields if not in global type
interface ExtendedCaseMoney extends CaseApi.CaseMoney {
  moneyPre?: number | string;
  description?: string;
  _categoryName?: string;
  detailData?: any; // Add detailData field
}

const emit = defineEmits(['reCalculate']);
const riderGridRef = ref<ExtendedVxeGridApi | null>(null);
const threeGridRef = ref<ExtendedVxeGridApi | null>(null);
const isRiderUpdatedModal = ref(false);
const isThreeUpdatedModal = ref(false);
const fileList = ref<Array<{ label: string; value: number | string }>>([]);
const caseId = ref<number | string>('');

// Helper to calculate summary
const calculateSummary = (data: ExtendedCaseMoney[]) => {
  let mainTotal = 0;
  let attachTotal = 0;
  let preTotal = 0;

  data.forEach((item) => {
    mainTotal += Number(item.moneryMain || 0);
    attachTotal += Number(item.moneryAttach || 0);
    preTotal += Number(item.moneyPre || 0);
  });

  return { mainTotal, attachTotal, preTotal, total: mainTotal + attachTotal };
};

const riderSummary = ref({
  mainTotal: 0,
  attachTotal: 0,
  preTotal: 0,
  total: 0,
});
const threeSummary = ref({
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
    detailData: row.detailData || {},
    rowId: row.id,
    fileList: fileList.value,
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
    const riderData = getRiderData();
    const threeData = getThreeData();

    await (isRiderUpdatedModal.value || isThreeUpdatedModal.value
      ? CaseMoneyUpdateApi(caseId.value, [...riderData!, ...threeData!])
      : CaseMoneyAddApi(caseId.value, [...riderData!, ...threeData!]));
    ElMessage.success('保存成功');
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
      fileList.value = data.fileList || [];
    }
  },
});

const updateSummaries = () => {
  const riderData = getRiderData() || [];
  const threeData = getThreeData() || [];
  riderSummary.value = calculateSummary(riderData);
  threeSummary.value = calculateSummary(threeData);
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
        15: '医保内医疗',
        16: '医保外医疗',
        17: '三者伤残金',
        18: '鉴定费',
        19: '精神损失费',
        20: '律师费',
        21: '诉讼费',
        22: '交通费',
        23: '被抚养人生活费',
        24: '重鉴费',
        25: '三者死亡金',
        26: '丧葬费',
        27: '后续医疗费',
        28: '三者误工费',
        29: '三者营养费',
        30: '三者护理费',
        31: '住院伙食费',
      };
      return (row.type && typeMap[row.type]) || '未知';
    },
  },
  {
    field: 'moneyPre',
    editRender: {},
    slots: { edit: 'edit_moneyPre' },
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
    field: 'description',
    editRender: {},
    slots: { edit: 'edit_description' },
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
  editConfig: { mode: 'row', trigger: 'click', autoClear: false },
  proxyConfig: {
    response: { result: 'list', total: 'total', list: 'list' },
    ajax: {
      query: async () => {
        const res = await CaseMoneyListApi(caseId.value, 1);
        setTimeout(updateSummaries, 100);
        return res;
      },
    },
  },
};

const threeGridOptions: VxeGridProps<ExtendedCaseMoney> = {
  columns: commonColumns,
  pagerConfig: { enabled: false },
  sortConfig: { multiple: true },
  toolbarConfig: { slots: { buttons: 'toolbar_buttons' } },
  editConfig: { mode: 'row', trigger: 'click', autoClear: false },
  proxyConfig: {
    response: { result: 'list', total: 'total', list: 'list' },
    ajax: {
      query: async () => {
        const res = await CaseMoneyListApi(caseId.value, 2);
        setTimeout(updateSummaries, 100);
        return res;
      },
    },
  },
};

const [RiderGrid, riderGridApi] = useVbenVxeGrid({
  gridOptions: riderGridOptions,
});
const [ThreeGrid, threeGridApi] = useVbenVxeGrid({
  gridOptions: threeGridOptions,
});

const pushEvent = async (
  gridRef: ExtendedVxeGridApi,
  type: number,
  category: 1 | 2,
) => {
  const $grid = gridRef.grid;
  if ($grid) {
    const record: ExtendedCaseMoney = {
      caseId: caseId.value,
      type,
      moneyPre: '',
      moneryMain: '',
      moneryAttach: '',
      description: '',
      isqishou: category,
      detailData: {}, // init
      // Required fields from CaseMoney (fill with defaults or empty)
      // We cast to any to bypass strict type checks for new/temp fields if necessary
      // or ensure all required fields are present.
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

const handleSelectMoneyType = (type: number, category: number) => {
  if (category === 1) {
    pushEvent(riderGridApi, type, category);
  } else {
    pushEvent(threeGridApi, type, category as 2);
  }
};

const getRiderData = () => riderGridApi.grid?.getFullData();
const getThreeData = () => threeGridApi.grid?.getFullData();

const handleInput = () => {
  updateSummaries();
};
</script>

<template>
  <Modal>
    <DetailModal />
    <div class="px-4 pb-4">
      <!-- Rider Section -->
      <div class="mb-6">
        <RiderGrid ref="riderGridRef" @checkbox-change="updateSummaries">
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
            <ElDropdown
              size="small"
              trigger="click"
              popper-class="money-dropdown-popper"
            >
              <ElButton
                :icon="AntdPlusOutlined"
                plain
                size="small"
                type="primary"
              >
                添加明细
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem @click="handleSelectMoneyType(1, 1)"
                    >医保内医疗</ElDropdownItem
                  >
                  <ElDropdownItem @click="handleSelectMoneyType(2, 1)"
                    >医保外医疗</ElDropdownItem
                  >
                  <!-- More options ... skipped for brevity, implementing common ones -->
                  <ElDropdownItem @click="handleSelectMoneyType(3, 1)"
                    >骑手伤残金</ElDropdownItem
                  >
                  <ElDropdownItem @click="handleSelectMoneyType(9, 1)"
                    >误工费</ElDropdownItem
                  >
                  <ElDropdownItem @click="handleSelectMoneyType(10, 1)"
                    >生活保障金</ElDropdownItem
                  >
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>

          <template #edit_moneyPre="{ row }">
            <ElInput
              v-model="row.moneyPre"
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
          <template #edit_description="{ row }">
            <ElInput v-model="row.description" placeholder="请输入说明" />
          </template>

          <template #detail_action="{ row }">
            <ElButton
              link
              type="primary"
              size="small"
              @click="handleDetailCalc(row)"
              >+ 添加明细</ElButton
            >
          </template>

          <template #action="{ row }">
            <ElButton
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

      <!-- Third Party Section -->
      <div class="mb-6">
        <ThreeGrid ref="threeGridRef" @checkbox-change="updateSummaries">
          <template #toolbar_buttons>
            <div class="flex items-center gap-4">
              <ElText class="text-lg font-bold"> 三者明细 </ElText>
              <div class="space-x-4 text-sm text-gray-600">
                <span>预报损总计: {{ threeSummary.preTotal }}</span>
                <span>主险总计: {{ threeSummary.mainTotal }}</span>
                <span>附加险总计: {{ threeSummary.attachTotal }}</span>
                <span class="font-bold text-red-600"
                  >总计: {{ threeSummary.total }}</span
                >
              </div>
            </div>
          </template>

          <template #toolbar-tools>
            <ElDropdown
              size="small"
              trigger="click"
              popper-class="money-dropdown-popper"
            >
              <ElButton
                :icon="AntdPlusOutlined"
                plain
                size="small"
                type="primary"
              >
                添加明细
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem @click="handleSelectMoneyType(13, 2)"
                    >机动车车损</ElDropdownItem
                  >
                  <ElDropdownItem @click="handleSelectMoneyType(15, 2)"
                    >医保内医疗</ElDropdownItem
                  >
                  <ElDropdownItem @click="handleSelectMoneyType(28, 2)"
                    >三者误工费</ElDropdownItem
                  >
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>

          <template #edit_moneyPre="{ row }">
            <ElInput
              v-model="row.moneyPre"
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
          <template #edit_description="{ row }">
            <ElInput v-model="row.description" placeholder="请输入说明" />
          </template>

          <template #detail_action="{ row }">
            <ElButton
              link
              type="primary"
              size="small"
              @click="handleDetailCalc(row)"
              >+ 添加明细</ElButton
            >
          </template>

          <template #action="{ row }">
            <ElButton
              link
              type="danger"
              size="small"
              @click="removeRow(row, threeGridApi)"
              >删除</ElButton
            >
          </template>
        </ThreeGrid>
      </div>

      <div class="mt-4 border-t pt-4 text-right">
        <div class="text-xl font-bold">
          总计赔付金额:
          <span class="text-red-600">{{
            riderSummary.total + threeSummary.total
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
