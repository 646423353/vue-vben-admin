<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { useUserIdStore } from '@vben/stores';
import { cloneDeep } from '@vben/utils';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import {
  ElButton,
  ElCard,
  ElCol,
  ElMessage,
  ElMessageBox,
  ElResult,
  ElRow,
  ElText,
} from 'element-plus';
import { saveAs } from 'file-saver';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  MembersMatchApi,
  MembersUpdateApi,
  type OrderApi,
} from '#/api/core/order';

export interface PlanParams {
  id?: string;
  保险编码: string;
  备注1: string;
  备注2: string;
  身份证: string;
  姓名: string;
  username?: string;
  beginTime: string;
  endTime: string;
}

const useridStore = useUserIdStore();
const router = useRouter();

const gridOptions: VxeGridProps<PlanParams> = {
  columns: [
    { field: '订单号', title: '订单号', minWidth: 180 },
    { field: '姓名', title: '姓名', minWidth: 120 },
    { field: '身份证号码', title: '身份证', minWidth: 180 },
    { field: '身份证号', title: '身份证', minWidth: 180, visible: false },
    { field: '身份证', title: '身份证', minWidth: 180, visible: false },
    { field: '保险编码', title: '保险编码', minWidth: 180 },
    { field: '备注1', title: '备注1', minWidth: 180 },
    { field: '备注2', title: '备注2', minWidth: 180 },
    {
      field: '操作',
      title: '操作类型',
      minWidth: 140,
      slots: { default: 'status' },
    },
    {
      field: 'matchResult',
      title: '操作反馈',
      minWidth: 180,
      slots: { default: 'state' },
      fixed: 'right',
    },
  ],
  editRules: {
    订单号: [{ required: true, message: '订单号不能为空' }],
    姓名: [
      { required: true, message: '姓名不能为空' },
      {
        validator({ cellValue }) {
          if (!/^[\u4E00-\u9FA5·]{2,16}$/.test(cellValue)) {
            return new Error('姓名格式不正确');
          }
        },
      },
    ],
    身份证: [
      { required: true, message: '身份证不能为空' },
      {
        validator({ cellValue }) {
          if (
            !/^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[12]\d|30|31)\d{3}[\dX]$/i.test(
              cellValue,
            )
          ) {
            return new Error('身份证格式不正确');
          }
        },
      },
    ],
    保险编码: [{ required: true, message: '保险编码不能为空' }],
    备注1: [
      {
        validator({ cellValue }) {
          if (!cellValue) return;
          if (typeof cellValue !== 'string' && typeof cellValue !== 'number') {
            return new Error('格式不正确');
          }
        },
      },
    ],
    备注2: [
      {
        validator({ cellValue }) {
          if (!cellValue) return;
          if (typeof cellValue !== 'string' && typeof cellValue !== 'number') {
            return new Error('格式不正确');
          }
        },
      },
    ],
  },
  validConfig: {
    msgMode: 'full',
  },
  pagerConfig: {
    enabled: false,
    pageSize: 10,
    pageSizes: [10, 20, 30, 50],
  },
  data: [],
  toolbarConfig: {
    slots: {
      tools: 'toolbar_tools',
    },
  },
  showOverflow: true,
  // minHeight: 300,
  importConfig: {
    message: false,
  },
  proxyConfig: {},
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const { height } = useWindowSize();

const resizeHandler: () => void = useDebounceFn(resize, 200);
watch([height], () => {
  resizeHandler?.();
});

function resize() {
  gridApi.setGridOptions({
    height: height.value - 320,
  });
}
resize();

const { closeCurrentTab } = useTabs();
const back = () => {
  closeCurrentTab();
  router.back();
};

const exportEvent = () => {
  const path = import.meta.env.VITE_GLOB_API_URL;
  const url = import.meta.env.VITE_INSURANCE_TEMPLATE_URL;
  saveAs(`${path}${url}`, '保险人员模板.xlsx');
};

const importEvent = () => {
  const $grid = gridApi.grid;
  if ($grid) {
    $grid.importData({
      types: ['xlsx', 'xls'],
      afterImportMethod: async ({ $table }) => {
        const data = $table.getFullData();
        data.forEach((item: any) => {
          if (typeof item.备注2 === 'object')
            item.备注2 = item.备注2?.formula ? item.备注2?.result : '';
          if (item.身份证 || item.身份证号)
            item.身份证号码 = item.身份证 || item.身份证号;
        });
        if (await fullValidEvent()) {
          matchEvent();
        } else {
          ElMessage.error('请先校验数据');
        }
      },
    });
  }
};

function getDateString() {
  return new Date()!.toISOString()!.split('T')[0]!.replaceAll('-', '');
}

// 获取随机字符串
function getRandomString() {
  const randomStr = Math.random().toString(36).slice(2);
  return randomStr;
}

async function fullValidEvent() {
  const $grid = gridApi.grid;
  if ($grid) {
    const errMap = await $grid.fullValidate(true);
    return !errMap;
  }
}

const loading = ref<boolean>(false);
const submitEvent = async () => {
  const $grid = gridApi.grid;
  if ($grid) {
    const subData = cloneDeep($grid.getTableData().tableData);
    if (subData.length === 0) {
      ElMessage.error('请先导入数据');
      return;
    }
    let hasError = false;
    for (const item of subData) {
      if (item.matchResultTag === 0) {
        hasError = true;
        break;
      }
    }
    if (hasError) {
      ElMessage.error('请先校验数据');
      return;
    }
    subData.forEach((item: any) => {
      if (!item.id) delete item.id;
      delete item['保险编码'];
      delete item['备注1'];
      delete item['备注2'];
      delete item['姓名'];
      delete item['操作'];
      delete item['订单号'];
      delete item['身份证号码'];
      delete item.matchResult;
    });

    try {
      await MembersUpdateApi(subData);
      ElMessageBox.alert('人员数据导入成功', '提示', {
        confirmButtonText: '确定',
        callback: () => {
          back();
        },
      });
    } catch (error) {
      console.error(error);
      ElMessageBox.alert(
        '由于数据过多，导入仍在进行中，无需再次提交，请稍后在订单列表中查看。稍后如果订单列表仍未出现，请联系管理员。',
        '提示',
        {
          showCancelButton: true,
          showConfirmButton: false,
          cancelButtonText: '关闭',
        },
      );
    } finally {
      loading.value = false;
    }
  }
};

const successNum = ref(0);
const errorNum = ref(0);

async function matchEvent() {
  successNum.value = 0;
  errorNum.value = 0;
  const $grid = gridApi.grid;
  gridApi.setLoading(true);
  const data = $grid.getTableData().tableData;
  if (data.length > 0) {
    const formatData = data.map((item: any) => {
      return {
        orderNo: item.订单号,
        username: item.姓名,
        creditcard: item.身份证号码,
        bxbm: item.保险编码,
        comment: item.备注1,
        comment2: item.备注2,
        userid: useridStore.userId,
        uuid: `${getDateString()}-${getRandomString()}`,
        operateTag:
          item.操作 === '增员'
            ? 1
            : item.操作 === '减员'
              ? 2
              : item.操作 === '取消增员'
                ? 3
                : 4,
      };
    });
    const result = await MembersMatchApi(
      formatData as OrderApi.MembersMatchData[],
    );
    gridApi.setLoading(false);
    $grid.remove();
    const resultFileds = result.map((item: any) => {
      item.matchResultTag === 1 ? successNum.value++ : errorNum.value++;
      return {
        ...item,
        订单号: item.orderNo,
        姓名: item.username,
        身份证号码: item.creditcard,
        保险编码: item.bxbm,
        备注1: item.comment,
        备注2: item.comment2,
        操作:
          item.operateTag === 1
            ? '增员'
            : item.operateTag === 2
              ? '减员'
              : item.operateTag === 3
                ? '取消增员'
                : '取消减员',
      };
    });
    gridApi.setGridOptions({
      data: resultFileds,
    });
  } else {
    ElMessage.error('请先导入人员数据');
  }
}
</script>

<template>
  <Page title="批量批单" v-loading="loading">
    <ElCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span>人员清单</span>
          <div>
            <ElButton @click="exportEvent"> 下载模板 </ElButton>
            <ElButton type="primary" @click="importEvent">
              导入人员数据
            </ElButton>
            <!-- <ElButton type="primary" @click="matchEvent"> 上传验证 </ElButton> -->
            <ElButton type="primary" @click="submitEvent"> 确认提交 </ElButton>
          </div>
        </div>
      </template>

      <Grid>
        <template #toolbar_tools>
          <ElRow :gutter="40">
            <ElCol :span="12">
              <ElResult
                :title="`${successNum}`"
                icon="success"
                sub-title="匹配成功"
              />
            </ElCol>
            <ElCol :span="12">
              <ElResult
                :title="`${errorNum}`"
                icon="error"
                sub-title="匹配失败"
              />
            </ElCol>
          </ElRow>
        </template>

        <template #status="{ row }">
          <ElText v-if="row['操作'] === '增员'" type="success"> 增员 </ElText>
          <ElText v-else-if="row['操作'] === '减员'" type="danger">
            减员
          </ElText>
          <ElText v-else-if="row['操作'] === '取消增员'" type="warning">
            取消增员
          </ElText>
          <ElText v-else type="danger">取消减员</ElText>
        </template>

        <template #state="{ row }">
          <ElText v-if="row.matchResultTag" type="success"> 匹配成功 </ElText>
          <ElText v-else-if="row.matchResult?.length > 0" type="danger">
            {{ row.matchResult.join(' / ') }}
          </ElText>
        </template>
      </Grid>
    </ElCard>
  </Page>
</template>

<style scoped>
:deep(.relative.rounded) {
  padding: 0;
}

:deep(.bg-background-deep) {
  display: none;
}

:deep(.el-result) {
  padding: 0 10px;
}

:deep(.el-result__icon svg) {
  width: 30px;
  height: 30px;
}

:deep(.el-result__title) {
  margin-top: 5px;
}

:deep(.el-result__title p) {
  font-size: 28px;
}

:deep(.el-result__subtitle) {
  margin-top: 5px;
}
</style>
