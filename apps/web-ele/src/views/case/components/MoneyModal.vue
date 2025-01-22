<script lang="ts" setup>
import type { ExtendedVxeGridApi } from 'node_modules/@vben/plugins/src/vxe-table/types';

import type { VxeGridProps } from '#/adapter/vxe-table';

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
  ElTag,
  ElText,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  type CaseApi,
  CaseMoneyAddApi,
  CaseMoneyListApi,
  CaseMoneyUpdateApi,
} from '#/api/core/case';

const emit = defineEmits(['reCalculate']);
const riderGridRef = ref<ExtendedVxeGridApi | null>(null);
const threeGridRef = ref<ExtendedVxeGridApi | null>(null);
const isRiderUpdatedModal = ref(false);
const isThreeUpdatedModal = ref(false);

const caseId = ref<number | string>('');

const riderGridOptions: VxeGridProps<CaseApi.CaseMoney> = {
  columns: [
    {
      field: 'type',
      title: '类型',
      formatter: ({ row }) => {
        const typeMap = {
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
        };
        return typeMap[row.type as keyof typeof typeMap] || '';
      },
    },
    {
      field: 'moneryMain',
      editRender: {},
      slots: { edit: 'edit_moneryMain' },
      title: '主险金额',
    },
    {
      field: 'moneryAttach',
      editRender: {},
      slots: { edit: 'edit_moneryAttach' },
      title: '附加险金额',
    },
    {
      field: 'daysCheck',
      editRender: {},
      slots: { edit: 'edit_daysCheck', default: 'show_daysCheck' },
      title: '核算天数',
    },
    {
      field: 'daysMianpei',
      editRender: {},
      slots: { edit: 'edit_daysMianpei', default: 'show_daysMianpei' },
      title: '免赔天数',
    },
    {
      title: '操作',
      slots: { default: 'action' },
    },
  ],
  pagerConfig: {
    enabled: false,
  },
  sortConfig: {
    multiple: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
  editConfig: {
    mode: 'row',
    trigger: 'click',
    autoClear: false,
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async () => {
        return await CaseMoneyListApi(caseId.value, 1);
      },
    },
  },
};

const threeGridOptions: VxeGridProps<CaseApi.CaseMoney> = {
  columns: [
    {
      field: 'type',
      title: '类型',
      formatter: ({ row }) => {
        const typeMap = {
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
        return typeMap[row.type as keyof typeof typeMap] || '';
      },
    },
    {
      field: 'moneryMain',
      editRender: {},
      slots: { edit: 'edit_moneryMain' },
      title: '主险金额',
    },
    {
      field: 'moneryAttach',
      editRender: {},
      slots: { edit: 'edit_moneryAttach' },
      title: '附加险金额',
    },
    {
      field: 'daysCheck',
      editRender: {},
      slots: { edit: 'edit_daysCheck', default: 'show_daysCheck' },
      title: '核算天数',
    },
    {
      field: 'daysMianpei',
      editRender: {},
      slots: { edit: 'edit_daysMianpei', default: 'show_daysMianpei' },
      title: '免赔天数',
    },
    {
      title: '操作',
      slots: { default: 'action' },
    },
  ],
  pagerConfig: {
    enabled: false,
  },
  sortConfig: {
    multiple: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
    },
  },
  editConfig: {
    mode: 'row',
    trigger: 'click',
    autoClear: false,
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
      list: 'list',
    },
    ajax: {
      query: async () => {
        return await CaseMoneyListApi(caseId.value, 2);
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
    const record = {
      caseId: caseId.value,
      type,
      moneryMain: '',
      moneryAttach: '',
      daysCheck: 0,
      daysMianpei: 0,
      isqishou: category,
    };
    const { row: newRow } = await $grid.insertAt(record, -1);
    $grid.setEditRow(newRow);
  }
};

const removeRow = async (
  row: CaseApi.CaseMoney,
  gridRef: ExtendedVxeGridApi,
) => {
  const $grid = gridRef.grid;
  if ($grid) {
    await $grid.remove(row);
  }
};

const handleSelectMoneyType = (type: number, category: number) => {
  if (category === 1) {
    pushEvent(riderGridApi, type, category);
  } else {
    pushEvent(threeGridApi, type, category as 2);
  }
};

const getRiderData = () => {
  const $grid = riderGridApi.grid;
  if ($grid) {
    return $grid.getFullData();
  }
};

const getThreeData = () => {
  const $grid = threeGridApi.grid;
  if ($grid) {
    return $grid.getFullData();
  }
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    caseId.value = '';
    modalApi.close();
  },
  async onConfirm() {
    const riderData = getRiderData();
    const threeData = getThreeData();
    const isSuccess = ref(false);

    if (isRiderUpdatedModal.value && isThreeUpdatedModal.value) {
      await CaseMoneyUpdateApi(caseId.value, [...riderData!, ...threeData!]);
      isSuccess.value = true;
    } else {
      await CaseMoneyAddApi(caseId.value, [...riderData!, ...threeData!]);
      isSuccess.value = true;
    }

    isSuccess.value && ElMessage.success('设置成功');
    caseId.value = '';
    emit('reCalculate');
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const {
        caseId: id,
        isRiderUpdated,
        isThreeUpdated,
      } = modalApi.getData<Record<string, any>>();
      caseId.value = id;
      isRiderUpdatedModal.value = isRiderUpdated;
      isThreeUpdatedModal.value = isThreeUpdated;
    }
  },
  title: '设置赔付明细',
});
</script>
<template>
  <Modal class="w-[800px]">
    <div class="px-4">
      <ElTag :closable="false" class="!mb-4 w-full" size="large" type="primary">
        (主险金额 + 附加险金额) + ((主险金额 + 附加险金额) * 核算天数 -
        (主险金额 + 附加险金额) * 免赔天数) = 赔付金额
      </ElTag>
      <div class="vp-raw w-full">
        <RiderGrid ref="riderGridRef">
          <template #toolbar_buttons>
            <ElText> 骑手明细 </ElText>
          </template>

          <template #toolbar-tools>
            <ElDropdown size="small" trigger="click">
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
                  <ElDropdownItem @click="handleSelectMoneyType(1, 1)">
                    医保内医疗
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(2, 1)">
                    医保外医疗
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(3, 1)">
                    骑手伤残金
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(4, 1)">
                    骑手死亡金
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(5, 1)">
                    被扶养人生活费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(6, 1)">
                    丧葬费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(7, 1)">
                    后续医疗费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(8, 1)">
                    住院津贴
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(9, 1)">
                    误工费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(10, 1)">
                    生活保障金
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(11, 1)">
                    护理费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(12, 1)">
                    营养费
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>

          <template #edit_moneryMain="{ row }">
            <ElInput
              v-model="row.moneryMain"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #edit_moneryAttach="{ row }">
            <ElInput
              v-model="row.moneyAttach"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #edit_daysCheck="{ row }">
            <ElInput
              v-if="
                row.type === 8 ||
                row.type === 9 ||
                row.type === 10 ||
                row.type === 11 ||
                row.type === 12
              "
              v-model="row.daysCheck"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #show_daysCheck="{ row }">
            {{
              row.type !== 8 &&
              row.type !== 9 &&
              row.type !== 10 &&
              row.type !== 11 &&
              row.type !== 12
                ? ''
                : row.daysCheck
            }}
          </template>

          <template #edit_daysMianpei="{ row }">
            <ElInput
              v-if="
                row.type === 8 ||
                row.type === 9 ||
                row.type === 10 ||
                row.type === 11 ||
                row.type === 12
              "
              v-model="row.daysMianpei"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #show_daysMianpei="{ row }">
            {{
              row.type !== 8 &&
              row.type !== 9 &&
              row.type !== 10 &&
              row.type !== 11 &&
              row.type !== 12
                ? ''
                : row.daysMianpei
            }}
          </template>

          <template #action="{ row }">
            <ElButton
              size="small"
              type="primary"
              @click="removeRow(row, riderGridApi)"
            >
              删除
            </ElButton>
          </template>
        </RiderGrid>

        <ElDivider />

        <ThreeGrid ref="threeGridRef">
          <template #toolbar_buttons>
            <ElText> 三者明细 </ElText>
          </template>

          <template #toolbar-tools>
            <ElDropdown size="small" trigger="click">
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
                  <ElDropdownItem @click="handleSelectMoneyType(13, 2)">
                    机动车车损
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(14, 2)">
                    物损
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(15, 2)">
                    医保内医疗
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(16, 2)">
                    医保外医疗
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(17, 2)">
                    三者伤残金
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(18, 2)">
                    鉴定费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(19, 2)">
                    精神损失费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(20, 2)">
                    律师费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(21, 2)">
                    诉讼费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(22, 2)">
                    交通费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(23, 2)">
                    被抚养人生活费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(24, 2)">
                    重鉴费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(25, 2)">
                    三者死亡金
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(26, 2)">
                    丧葬费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(27, 2)">
                    后续医疗费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(28, 2)">
                    三者误工费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(29, 2)">
                    三者营养费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(30, 2)">
                    三者护理费
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleSelectMoneyType(31, 2)">
                    住院伙食费
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>

          <template #edit_moneryMain="{ row }">
            <ElInput
              v-model="row.moneryMain"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #edit_moneryAttach="{ row }">
            <ElInput
              v-model="row.moneyAttach"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #edit_daysCheck="{ row }">
            <ElInput
              v-if="
                row.type === 28 ||
                row.type === 29 ||
                row.type === 30 ||
                row.type === 31
              "
              v-model="row.daysCheck"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #show_daysCheck="{ row }">
            {{
              row.type !== 28 &&
              row.type !== 29 &&
              row.type !== 30 &&
              row.type !== 31
                ? ''
                : row.daysCheck
            }}
          </template>

          <template #edit_daysMianpei="{ row }">
            <ElInput
              v-if="
                row.type === 28 ||
                row.type === 29 ||
                row.type === 30 ||
                row.type === 31
              "
              v-model="row.daysMianpei"
              placeholder="请输入"
              type="number"
            />
          </template>

          <template #show_daysMianpei="{ row }">
            {{
              row.type !== 28 &&
              row.type !== 29 &&
              row.type !== 30 &&
              row.type !== 31
                ? ''
                : row.daysMianpei
            }}
          </template>

          <template #action="{ row }">
            <ElButton
              size="small"
              type="primary"
              @click="removeRow(row, threeGridApi)"
            >
              删除
            </ElButton>
          </template>
        </ThreeGrid>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-form-item .el-date-editor) {
  width: 100%;
}
</style>
