<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CaseMoneyApi } from '#/api/core/case-money';

import { onMounted, ref } from 'vue';

import { ElButton, ElCascader, ElInput, ElText } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

// Use TbCaseMoney from API
type ExtendedCaseMoney = CaseMoneyApi.TbCaseMoney;

interface CascaderOption {
  value: number;
  label: string;
  children?: CascaderOption[];
  [key: string]: any; // Allow any additional properties
}

const props = defineProps<{
  cascaderOptions: CascaderOption[];
  caseId: number | string;
  isReadonly?: boolean;
  items: ExtendedCaseMoney[];
  moneyCateMap: Map<number, { cate: number; catename: string }>;
  moneyTypeMap: Map<number, string>;
  subjectId: number | string;
  subjectName: string;
}>();

const emit = defineEmits<{
  (e: 'updateSummaries'): void;
  (e: 'checkDetail', row: ExtendedCaseMoney): void;
}>();

const summary = ref({
  mainTotal: 0,
  attachTotal: 0,
  preTotal: 0,
  total: 0,
});

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

const updateLocalSummary = () => {
  const data = gridApi.grid?.getFullData() || [];
  summary.value = calculateSummary(data);
  emit('updateSummaries');
};

const commonColumns = [
  {
    field: 'type',
    title: '分类',
    width: 120,
    formatter: ({ row }: { row: ExtendedCaseMoney }) => {
      const typeMap: Record<number, string> = {
        13: '机动车车损',
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
        // Support others if necessary, but these are for Three Party
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

const gridOptions: VxeGridProps<ExtendedCaseMoney> = {
  columns: commonColumns,
  pagerConfig: { enabled: false },
  sortConfig: { multiple: true },
  toolbarConfig: { slots: { buttons: 'toolbar_buttons' } },
  editConfig: { mode: 'row', trigger: 'click', autoClear: false },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: gridOptions as any,
});

// Cascader selection state
const selectedMoneyType = ref<number[]>([]);

// Load initial data on mount only
onMounted(() => {
  if (gridApi.grid && props.items && props.items.length > 0) {
    gridApi.grid.reloadData(props.items);
    updateLocalSummary();
  }
});

// Handle cascader selection
const handleMoneyTypeSelect = (value: any) => {
  const values = value as number[];
  if (values && Array.isArray(values) && values.length === 2) {
    const typeId = values[1];
    if (!typeId) return;

    const typeName = props.moneyTypeMap.get(typeId) || '';
    const cateInfo = props.moneyCateMap.get(typeId);
    pushEvent(typeId, typeName, cateInfo?.cate, cateInfo?.catename);
    selectedMoneyType.value = [];
  }
};

const pushEvent = async (
  type: number,
  typename?: string,
  cate?: number,
  catename?: string,
) => {
  const $grid = gridApi.grid;
  if ($grid) {
    const record: ExtendedCaseMoney = {
      caseId: props.caseId,
      type,
      typename: typename || '',
      cate: cate || 0,
      catename: catename || '',
      moneryHope: '',
      moneryMain: '',
      moneryAttach: '',
      yiju: '',
      isqishou: props.subjectId,
      zt: props.subjectId,
      ztName: '三者',
      pics: '',
    } as any;
    const { row: newRow } = await $grid.insertAt(record, -1);
    $grid.setEditRow(newRow);
    updateLocalSummary();
  }
};

const removeRow = async (row: ExtendedCaseMoney) => {
  const $grid = gridApi.grid;
  if ($grid) {
    await $grid.remove(row);
    updateLocalSummary();
  }
};

const handleInput = () => {
  updateLocalSummary();
};

const handleCheckboxChange = () => {
  updateLocalSummary();
};

const getTotal = () => summary.value.total;
const getFullData = () => gridApi.grid?.getFullData() || [];
const reloadData = (newData: ExtendedCaseMoney[]) => {
  if (gridApi.grid) {
    gridApi.grid.reloadData(newData);
    // Delay update to ensure data is loaded
    setTimeout(() => {
      updateLocalSummary();
    }, 50);
  }
};

defineExpose({
  getTotal,
  getFullData,
  reloadData,
});
</script>

<template>
  <div class="mb-6">
    <Grid @checkbox-change="handleCheckboxChange">
      <template #toolbar_buttons>
        <div class="flex items-center gap-4">
          <ElText class="text-lg font-bold"> {{ subjectName }} </ElText>
          <div class="space-x-4 text-sm text-gray-600">
            <span>预报损总计: {{ summary.preTotal }}</span>
            <span>主险总计: {{ summary.mainTotal }}</span>
            <span>附加险总计: {{ summary.attachTotal }}</span>
            <span class="font-bold text-red-600"
              >总计: {{ summary.total }}</span
            >
          </div>
        </div>
      </template>

      <template #toolbar-tools>
        <ElCascader
          v-model="selectedMoneyType"
          :options="cascaderOptions"
          placeholder="请选择项目"
          :props="{ expandTrigger: 'hover', value: 'value', label: 'label' }"
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
          @click="emit('checkDetail', row)"
        >
          {{ isReadonly ? '查看明细' : '编辑明细' }}
        </ElButton>
        <ElButton
          v-else-if="!isReadonly"
          link
          type="primary"
          size="small"
          @click="emit('checkDetail', row)"
        >
          + 添加明细
        </ElButton>
      </template>

      <template #action="{ row }">
        <ElButton link type="danger" size="small" @click="removeRow(row)"
          >删除</ElButton
        >
      </template>
    </Grid>
  </div>
</template>

<style scoped>
:deep(.el-form-item .el-date-editor) {
  width: 100%;
}
</style>
