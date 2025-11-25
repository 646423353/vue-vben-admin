<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref, watch } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElLink,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { GroupListApi } from '#/api/core/group';

export interface PlanParams {
  id?: string;
  insureSn: string;
  groupId: number | string;
  groupName: string;
  mainInsureId: string;
  mainInsureName: string;
  additionalInsureId: string;
  additionalInsureName: string;
  beginTime: string;
  endTime: string;
  status: number;
}

interface Props {
  list?: PlanParams[];
  preview?: boolean;
}

const props = defineProps<Props>();

const gridOptions: VxeGridProps<PlanParams> = {
  columns: [
    { type: 'checkbox', width: 70 },
    { type: 'seq', width: 70 },
    {
      field: 'groupName',
      title: '保障编码',
      editRender: {},
      slots: { edit: 'edit_group' },
      formatter: ({ row }) =>
        row.insureSn ? `${row.insureSn} / ${row.groupName}` : '',
      width: 240,
    },
    { field: 'mainInsureName', title: '主险', minWidth: 180 },
    { field: 'additionalInsureName', title: '附加险', minWidth: 180 },
    {
      field: 'beginTime',
      title: '启用时间',
      editRender: {},
      slots: { edit: 'edit_begin' },
      width: 240,
      formatter: ({ row }) =>
        row.beginTime ? moment(row.beginTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'endTime',
      title: '止用时间',
      editRender: {},
      slots: { edit: 'edit_end' },
      width: 240,
      formatter: ({ row }) =>
        row.endTime ? moment(row.endTime).format('YYYY-MM-DD') : '',
    },
    {
      field: 'status',
      title: '状态',
      editRender: {},
      slots: { edit: 'edit_status', default: 'status' },
      formatter: ({ row }) => (row.status === 1 ? '可用' : '不可用'),
      width: 120,
    },
    {
      field: 'action',
      slots: { default: 'action' },
      title: '操作',
      width: 120,
      fixed: 'right',
    },
  ],
  editRules: {
    groupName: [{ required: true, message: '保险编码不能为空' }],
  },
  editConfig: {
    mode: 'row',
    trigger: 'click',
    autoClear: false,
    enabled: !props.preview,
  },
  pagerConfig: {
    enabled: false,
  },
  data: [],
  showOverflow: true,
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function hasEditStatus(row: PlanParams) {
  return gridApi.grid?.isEditByRow(row);
}

function editRowEvent(row: PlanParams) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: PlanParams) {
  if (!row.groupId) return ElMessage.error('请选择保障编码');
  await gridApi.grid?.clearEdit();
}

const cancelRowEvent = (_row: PlanParams) => {
  gridApi.grid?.clearEdit();
};

interface GroupListData {
  id: number;
  insureSn: string;
  groupName: string;
  mainInsure: string;
  mainInsureId: string;
  additionalInsure: string;
  additionalInsureId: string;
}

const groupList = ref<GroupListData[]>([]);

const getGroupList = async () => {
  const { list } = await GroupListApi(
    {
      status: 1,
    },
    {
      page: 1,
      size: 2000,
    },
  );
  groupList.value = list;
};

getGroupList();

const groupChange = (value: number, row: PlanParams) => {
  const selectedOption = groupList.value.find((option) => option.id === value);
  if (selectedOption) {
    row.groupId = selectedOption.id;
    row.mainInsureId = selectedOption.mainInsureId;
    row.additionalInsureId = selectedOption.additionalInsureId;
    row.insureSn = selectedOption.insureSn;
    row.groupName = selectedOption.groupName;
    row.mainInsureName = selectedOption.mainInsure;
    row.additionalInsureName = selectedOption.additionalInsure;
  }
};

const pushEvent = async () => {
  const $grid = gridApi.grid;
  if ($grid) {
    const record = {
      groupName: '',
      insureSn: '',
      mainInsureName: '',
      additionalInsureName: '',
      beginTime: '',
      endTime: '',
      groupId: '',
      mainInsureId: '',
      additionalInsureId: '',
      status: 1,
    };
    const { row: newRow } = await $grid.insertAt(record, -1);
    $grid.setEditRow(newRow);
  }
};

// const removeSelectEvent = async () => {
//   const $grid = gridApi.grid;
//   if ($grid) {
//     const selectRecords = $grid.getCheckboxRecords();
//     if (selectRecords.length > 0) {
//       $grid.removeCheckboxRow();
//       ElMessage.success('已删除选中');
//     } else {
//       ElMessage.info('未选择数据');
//     }
//   }
// };

const getData = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    return $grid.getInsertRecords();
  }
};

async function fullValidEvent() {
  const $grid = gridApi.grid;
  if ($grid) {
    const errMap = await $grid.fullValidate(true);
    if (errMap) {
      return false;
    } else {
      await gridApi.grid?.clearEdit();
      return true;
    }
  }
}

defineExpose({
  fullValidEvent,
  getData,
});

onMounted(() => {
  const $grid = gridApi.grid;

  watch(
    () => props.list,
    async (newList) => {
      if (newList) {
        newList.forEach((item: PlanParams) => {
          item.groupId = Number(item.groupId);
          const groupData = groupList.value.find(
            (group) => group.id === item.groupId,
          );
          if (groupData) {
            item.insureSn = groupData.insureSn;
            item.groupName = groupData.groupName;
          }
        });
        await $grid.insert(newList);
      }
    },
    { immediate: true },
  );

  if (props.preview) {
    $grid.hideColumn('action');
  }
});
</script>

<template>
  <div>
    <div v-if="!props.preview" class="mb-4">
      <ElButton type="primary" @click="pushEvent"> 新增 </ElButton>
      <!-- <ElButton type="danger" @click="removeSelectEvent"> 批量删除 </ElButton> -->
    </div>
    <Grid>
      <template #edit_group="{ row }">
        <ElSelect
          v-model="row.groupId"
          :popper-append-to-body="false"
          placeholder="请选择"
          @change="(value) => groupChange(value, row)"
        >
          <ElOption
            v-for="item in groupList"
            :key="item.id"
            :label="`${item.insureSn} / ${item.groupName}`"
            :value="item.id"
          />
        </ElSelect>
      </template>

      <template #edit_begin="{ row }">
        <ElDatePicker
          v-model="row.beginTime"
          placeholder="请选择"
          type="date"
        />
      </template>

      <template #edit_end="{ row }">
        <ElDatePicker v-model="row.endTime" placeholder="请选择" type="date" />
      </template>

      <template #edit_status="{ row }">
        <ElSwitch
          v-model="row.status"
          :active-value="1"
          :inactive-value="0"
          active-text="可用"
          inactive-text="不可用"
          inline-prompt
        />
      </template>

      <template #status="{ row }">
        <ElTag v-if="row.status === 1" effect="dark" type="success">可用</ElTag>
        <ElTag v-else effect="dark" type="danger">不可用</ElTag>
      </template>

      <template #action="{ row }">
        <template v-if="hasEditStatus(row)">
          <ElLink class="mr-2" type="primary" @click="saveRowEvent(row)">
            保存
          </ElLink>
          <ElLink v-if="row.id" type="info" @click="cancelRowEvent(row)">
            取消
          </ElLink>
        </template>
        <template v-else>
          <ElLink type="primary" @click="editRowEvent(row)"> 编辑 </ElLink>
        </template>
      </template>
    </Grid>
  </div>
</template>
