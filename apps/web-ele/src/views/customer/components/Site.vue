<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { codeToText, regionData } from 'element-china-area-data';
import {
  ElButton,
  ElCascader,
  ElInput,
  ElLink,
  ElMessage,
  ElSwitch,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

export interface SiteParams {
  id?: string;
  name: string;
  owner: string;
  phone: string;
  province: string | undefined;
  city: string | undefined;
  district: string | undefined;
  addrIds?: string[];
  addr: string;
  address: string;
  status: number;
}

interface Props {
  list?: SiteParams[];
  preview?: boolean;
}

const props = defineProps<Props>();
const options = ref(regionData);

const gridOptions: VxeGridProps<SiteParams> = {
  columns: [
    { type: 'checkbox', width: 70 },
    { type: 'seq', width: 70 },
    {
      field: 'name',
      title: '站点名称',
      editRender: {},
      slots: { edit: 'edit_name' },
      minWidth: 180,
    },
    {
      field: 'addrIds',
      title: '所在地区',
      editRender: {},
      slots: { edit: 'edit_group' },
      formatter: ({ row }) => {
        row.addr = JSON.stringify(row.addrIds);
        return row.addrIds
          ? `${row.province} / ${row.city} / ${row.district}`
          : '';
      },
      minWidth: 240,
    },
    {
      field: 'address',
      title: '详细地址',
      editRender: {},
      slots: { edit: 'edit_address' },
      minWidth: 300,
    },
    {
      field: 'owner',
      title: '站长姓名',
      editRender: {},
      slots: { edit: 'edit_owner' },
      minWidth: 180,
    },
    {
      field: 'phone',
      title: '站长电话',
      editRender: {},
      slots: { edit: 'edit_phone' },
      minWidth: 180,
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
    name: [{ required: true, message: '站点名称不能为空' }],
    addrIds: [{ required: true, message: '所在地区不能为空' }],
    owner: [{ required: true, message: '站长姓名不能为空' }],
    phone: [
      {
        validator({ cellValue }) {
          if (!cellValue) return;
          if (!/^(?:(?:\+|00)86)?1[3-9]\d{9}$/.test(cellValue)) {
            return new Error('手机号格式不正确');
          }
        },
      },
    ],
  },
  editConfig: {
    mode: 'row',
    trigger: 'click',
    autoClear: false,
  },
  pagerConfig: {
    enabled: false,
  },
  data: [],
  showOverflow: true,
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function hasEditStatus(row: SiteParams) {
  return gridApi.grid?.isEditByRow(row);
}

function editRowEvent(row: SiteParams) {
  gridApi.grid?.setEditRow(row);
}

async function saveRowEvent(row: SiteParams) {
  const errMap = await gridApi.grid.validateField(row, [
    'name',
    'addrIds',
    'owner',
    'phone',
  ]);
  if (errMap) {
    ElMessage.error('校验不通过！');
  } else {
    await gridApi.grid?.clearEdit();
  }
}

const cancelRowEvent = (_row: SiteParams) => {
  gridApi.grid?.clearEdit();
};

const areaChange = (value: any, row: SiteParams) => {
  if (value[0] && value[1] && value[2]) {
    row.province = codeToText[value[0] as string];
    row.city = codeToText[value[1] as string];
    row.district = codeToText[value[2] as string];
  }
};

const pushEvent = async () => {
  const $grid = gridApi.grid;
  if ($grid) {
    const record = {
      name: '',
      owner: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      addr: '',
      address: '',
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
  setTimeout(async () => {
    if (props.list) {
      props.list.forEach((item: SiteParams) => {
        item.addrIds = JSON.parse(item.addr);
      });
      await $grid.insert(props.list);
    }

    if (props.preview) {
      $grid.hideColumn('action');
    }
  }, 500);
});
</script>

<template>
  <div>
    <div v-if="!props.preview" class="mb-4">
      <ElButton type="primary" @click="pushEvent"> 新增 </ElButton>
      <!-- <ElButton type="danger" @click="removeSelectEvent"> 批量删除 </ElButton> -->
    </div>
    <Grid>
      <template #edit_name="{ row }">
        <ElInput v-model="row.name" placeholder="请输入" />
      </template>

      <template #edit_group="{ row }">
        <ElCascader
          v-model="row.addrIds"
          :options="options"
          placeholder="请选择"
          @change="(value) => areaChange(value, row)"
        />
      </template>

      <template #edit_address="{ row }">
        <ElInput v-model="row.address" placeholder="请输入" />
      </template>

      <template #edit_owner="{ row }">
        <ElInput v-model="row.owner" placeholder="请输入" />
      </template>

      <template #edit_phone="{ row }">
        <ElInput v-model="row.phone" placeholder="请输入" />
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
