<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TbCustomerStopDto } from '#/api/core/stop';

import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { useDebounceFn, useWindowSize } from '@vueuse/core';
import { regionData } from 'element-china-area-data';
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
import { CustomerListApi } from '#/api/core/customer';
import { StopBatchAddApi } from '#/api/core/stop';
import { extractTextFromRichText } from '#/utils/formmatRichText';

export interface StopImportRow {
  '所属客户*'?: string;
  所属城市?: string;
  '站点名称*'?: string;
  '所在地区-省份'?: string;
  '所在地区-城市'?: string;
  '所在地区-县区'?: string;
  详细地址?: string;
  '站长姓名*'?: string;
  站长电话?: string;
  状态?: string;
  matchResult?: string[];
  matchResultTag?: number;
}

const router = useRouter();

const gridOptions: VxeGridProps<StopImportRow> = {
  columns: [
    { field: '所属客户*', title: '所属客户', minWidth: 180 },
    { field: '所属城市', title: '所属城市', minWidth: 120 },
    { field: '站点名称*', title: '站点名称', minWidth: 150 },
    { field: '所在地区-省份', title: '省份', minWidth: 100 },
    { field: '所在地区-城市', title: '城市', minWidth: 100 },
    { field: '所在地区-县区', title: '县区', minWidth: 100 },
    { field: '详细地址', title: '详细地址', minWidth: 200 },
    { field: '站长姓名*', title: '站长姓名', minWidth: 120 },
    { field: '站长电话', title: '站长电话', minWidth: 140 },
    { field: '状态', title: '状态', minWidth: 80 },
    {
      field: 'matchResult',
      title: '操作反馈',
      minWidth: 180,
      slots: { default: 'state' },
      fixed: 'right',
    },
  ],
  editRules: {
    '所属客户*': [{ required: true, message: '所属客户不能为空' }],
    '站点名称*': [{ required: true, message: '站点名称不能为空' }],
    '站长姓名*': [{ required: true, message: '站长姓名不能为空' }],
    站长电话: [
      {
        validator({ cellValue }) {
          if (!cellValue) return;
          if (!/^1\d{10}$/.test(cellValue)) {
            return new Error('手机号格式不正确');
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
  importConfig: {
    message: false,
  },
  proxyConfig: {},
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions } as any);

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
  const url = '/swagger/e6ae90493797413aa15337ab69ade41e.xlsx';
  saveAs(`${path}${url}`, '站点导入模板.xlsx');
};

const importEvent = async () => {
  // 确保客户列表已加载
  if (customerMap.value.size === 0) {
    await loadCustomerList();
  }

  const $grid = gridApi.grid;
  if ($grid) {
    $grid.importData({
      types: ['xlsx', 'xls'],
      afterImportMethod: async ({ $table }) => {
        const data = $table.getFullData();
        let hasInvalidCustomer = false;
        const invalidCustomers: string[] = [];

        data.forEach((item: any) => {
          item['所属客户*'] = extractTextFromRichText(item['所属客户*']);
          item['所属城市'] = extractTextFromRichText(item['所属城市']);
          item['站点名称*'] = extractTextFromRichText(item['站点名称*']);
          item['所在地区-省份'] = extractTextFromRichText(
            item['所在地区-省份'],
          );
          item['所在地区-城市'] = extractTextFromRichText(
            item['所在地区-城市'],
          );
          item['所在地区-县区'] = extractTextFromRichText(
            item['所在地区-县区'],
          );
          item['详细地址'] = extractTextFromRichText(item['详细地址']);
          item['站长姓名*'] = extractTextFromRichText(item['站长姓名*']);
          item['站长电话'] = extractTextFromRichText(item['站长电话']);
          item['状态'] = extractTextFromRichText(item['状态']);

          // 验证客户名称是否存在
          const customerName = item['所属客户*'];
          if (customerName && !customerMap.value.has(customerName)) {
            hasInvalidCustomer = true;
            if (!invalidCustomers.includes(customerName)) {
              invalidCustomers.push(customerName);
            }
          }
        });

        if (hasInvalidCustomer) {
          ElMessage.error(`未找到以下客户: ${invalidCustomers.join(', ')}`);
          errorNum.value = invalidCustomers.length;
          return;
        }

        if (await fullValidEvent()) {
          successNum.value = data.length;
          errorNum.value = 0;
          ElMessage.success(`成功导入 ${data.length} 条数据，请确认后提交`);
        } else {
          ElMessage.error('数据校验失败，请检查必填字段');
        }
      },
    });
  }
};

async function fullValidEvent() {
  const $grid = gridApi.grid;
  if ($grid) {
    try {
      const errMap = await $grid.fullValidate(true);
      return !errMap;
    } catch (error) {
      console.error('验证失败:', error);
      return false;
    }
  }
  return false;
}

const loading = ref<boolean>(false);
const submitEvent = async () => {
  if (loading.value) {
    return;
  }

  const $grid = gridApi.grid;
  if ($grid) {
    loading.value = true;
    try {
      const data = $grid.getTableData().fullData;
      if (data.length === 0) {
        ElMessage.error('请先导入数据');
        return;
      }

      // 转换数据格式
      const groupInfos: TbCustomerStopDto[] = data.map((item: any) => {
        const customerName = item['所属客户*'];
        const customerId = customerMap.value.get(customerName);
        if (!customerId) {
          throw new Error(`未找到客户: ${customerName}`);
        }

        // 转换省/市/区名称为编码
        const provinceName = item['所在地区-省份'];
        const cityName = item['所在地区-城市'];
        const districtName = item['所在地区-县区'];
        const addrCodes = areaNameToCode(provinceName, cityName, districtName);

        return {
          customerId: String(customerId),
          name: item['站点名称*'],
          province: provinceName,
          city: cityName,
          district: districtName,
          addr: addrCodes ? JSON.stringify(addrCodes) : undefined,
          address: item['详细地址'],
          owner: item['站长姓名*'],
          phone: item['站长电话'] ? String(item['站长电话']) : undefined,
          status:
            item['状态'] === '启用'
              ? 1
              : item['状态'] === '停用'
                ? 0
                : item['状态'] === '删除'
                  ? 2
                  : 1,
        };
      });

      await StopBatchAddApi(groupInfos);
      ElMessageBox.alert('站点数据导入成功', '提示', {
        confirmButtonText: '确定',
        callback: () => {
          back();
        },
      });
    } catch (error) {
      console.error('提交失败:', error);
      ElMessage.error('提交失败，请重试');
    } finally {
      loading.value = false;
    }
  }
};

const successNum = ref(0);
const errorNum = ref(0);

// 根据省/市/区名称查找对应的编码
function areaNameToCode(
  provinceName?: string,
  cityName?: string,
  districtName?: string,
): null | string[] {
  if (!provinceName || !cityName || !districtName) {
    return null;
  }

  // 遍历 regionData 查找匹配的省份
  for (const province of regionData) {
    if (province.label === provinceName && province.children) {
      // 找到省份，继续查找城市
      for (const city of province.children) {
        if (city.label === cityName && city.children) {
          // 找到城市，继续查找区县
          for (const district of city.children) {
            if (district.label === districtName) {
              // 找到完整匹配，返回编码数组
              return [province.value, city.value, district.value];
            }
          }
        }
      }
    }
  }

  return null;
}

// 客户名称到ID的映射
const customerMap = ref<Map<string, number>>(new Map());

async function loadCustomerList() {
  try {
    const { list } = await CustomerListApi(
      {},
      {
        page: 1,
        size: 2000,
        withTag: 0,
        withStop: 0,
        withInsure: 0,
      },
    );
    customerMap.value.clear();
    list.forEach((item: any) => {
      customerMap.value.set(item.username, item.id);
    });
  } catch (error) {
    console.error('加载客户列表失败:', error);
    ElMessage.error('加载客户列表失败');
  }
}

onMounted(() => {
  loadCustomerList();
});
</script>

<template>
  <Page title="站点批量导入">
    <ElCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span>站点清单</span>
          <div>
            <ElButton @click="exportEvent"> 下载模板 </ElButton>
            <ElButton type="primary" @click="importEvent">
              导入站点数据
            </ElButton>
            <ElButton type="primary" @click="submitEvent" :loading="loading">
              确认提交
            </ElButton>
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
                sub-title="待导入"
              />
            </ElCol>
            <ElCol :span="12">
              <ElResult
                :title="`${errorNum}`"
                icon="error"
                sub-title="校验失败"
              />
            </ElCol>
          </ElRow>
        </template>

        <template #state="{ row }">
          <ElText v-if="row.matchResultTag === 1" type="success">
            导入成功
          </ElText>
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
