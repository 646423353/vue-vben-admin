<template>
  <ElDialog
    v-model="visible"
    title="选择理赔工单数据"
    width="850px"
    destroy-on-close
    align-center
    class="work-order-import-dialog"
  >
    <!-- 过滤器与控制栏 -->
    <div class="mb-5 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold text-slate-700 dark:text-slate-300"
          >工单状态筛选：</span
        >
        <ElSelect v-model="statusFilter" class="!w-36" @change="handleSearch">
          <ElOption label="全部工单" value="" />
          <ElOption label="待处理" value="pending" />
          <ElOption label="处理中" value="processing" />
          <ElOption label="已完成" value="completed" />
          <ElOption label="已取消" value="cancelled" />
        </ElSelect>
      </div>
      <ElButton type="primary" :icon="Refresh" circle @click="loadData" />
    </div>

    <!-- 工单列表卡片网格容器 -->
    <div v-loading="loading" class="min-h-[250px] pr-1">
      <div
        v-if="tableData.length === 0"
        class="flex flex-col items-center justify-center py-12 text-slate-400"
      >
        <ElEmpty description="暂无待处理工单数据" />
      </div>
      <div
        v-else
        class="custom-scrollbar grid max-h-[420px] grid-cols-1 gap-4 overflow-y-auto px-1 py-1 md:grid-cols-2"
      >
        <div
          v-for="row in tableData"
          :key="row.id"
          class="work-order-card flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
        >
          <div class="card-body">
            <!-- 头部编号与创建时间 -->
            <div
              class="mb-3 flex items-center justify-between border-b border-dashed border-slate-100 pb-2 dark:border-slate-800"
            >
              <span
                class="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
              >
                工单号：{{ row.orderNo }}
              </span>
              <span class="text-xs text-slate-400">
                {{ formatTime(row.createdAt) }}
              </span>
            </div>

            <!-- 卡片主体结构化字段信息 -->
            <div class="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >工单系统编号：</span
                >
                <span class="font-mono text-slate-700 dark:text-slate-200">{{
                  row.orderNo
                }}</span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400">骑手：</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">
                  {{ row._parsed?.riderName || row.contactName || '-' }}
                </span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >出险时间：</span
                >
                <span class="text-slate-700 dark:text-slate-200">{{
                  row._parsed?.accidentTime || '-'
                }}</span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >出险位置：</span
                >
                <span class="break-all text-slate-700 dark:text-slate-200">{{
                  row._parsed?.accidentAddress || '-'
                }}</span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >所属客户：</span
                >
                <span class="text-slate-700 dark:text-slate-200">{{
                  row._parsed?.companyName || row.customerName || '-'
                }}</span>
              </div>
            </div>
          </div>

          <!-- 操作底部栏（选择按钮） -->
          <div
            class="card-footer mt-4 flex justify-end border-t border-slate-50 pt-3 dark:border-slate-800/40"
          >
            <ElButton
              type="primary"
              size="default"
              class="!rounded-xl !px-6 font-semibold shadow-sm transition-all hover:shadow"
              :loading="importingId === row.id"
              @click="handleImport(row)"
            >
              选择
            </ElButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页器 -->
    <div class="mt-5 flex justify-end">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="visible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
} from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import moment from 'moment';
import { importFromWorkOrderApi } from '#/api/core/case-record';
import type { WorkOrderImportDto } from '#/api/core/case-record';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'import-success', data: any): void;
}>();

const visible = ref(false);
const loading = ref(false);
const importingId = ref<number | null>(null);

// 线上测试环境工单系统固定地址，通过 Vite 本地反向代理转发避开 CORS 跨域头冲突报错
const apiBase = '/workorder-api';
const statusFilter = ref('pending');
const tableData = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 双向绑定 visible 属性
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      loadData();
    }
  },
);

watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 格式化时间函数
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  return moment(timeStr).format('YYYY-MM-DD HH:mm:ss');
};

// 分页拉取工单列表
const loadData = async () => {
  loading.value = true;
  try {
    let url = `${apiBase}/api/work-orders/claim-reports?page=${currentPage.value}&pageSize=${pageSize.value}`;
    if (statusFilter.value) {
      url += `&status=${statusFilter.value}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`请求错误: ${response.status}`);
    }
    const res = await response.json();

    // 解析每一条工单的描述文本，供卡片列表预备呈现
    tableData.value = (res.items || []).map((row: any) => {
      row._parsed = parseDescription(row.description || '');
      return row;
    });

    total.value = res.total || 0;
  } catch (error: any) {
    console.error('拉取数据失败', error);
    ElMessage.error(`拉取待处理工单失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  loadData();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadData();
};

// 解析工单中的描述为结构化键值对象
const parseDescription = (description: string): Partial<WorkOrderImportDto> => {
  const dto: Partial<WorkOrderImportDto> = {};

  // 匹配映射表（键名统一做无空格、英文半角括号清洗）
  const maps: Record<string, keyof WorkOrderImportDto> = {
    公司名称: 'companyName',
    城市名称: 'cityName',
    站点名称: 'stopName',
    站长姓名: 'stopOwnerName',
    联系方式: 'contactPhone',
    骑手ID: 'riderId',
    骑手姓名: 'riderName',
    骑手身份证号: 'riderIdCard',
    骑手电话: 'riderPhone',
    事发时间: 'accidentTime',
    事发地点: 'accidentAddress',
    事故经过: 'accidentDesc',
    '受伤部位(物损情况)': 'injuryPart',
    '是否涉及三者(三者信息)': 'thirdPartyInfo',
    就诊医院名称: 'hospitalName',
    是否住院: 'isHospitalized',
    '目前/预计治疗金额': 'treatmentAmount',
    是否报警或责任认定结果: 'policeOrLiability',
  };

  if (!description) return dto;

  // 使用换行符切割为单行进行解析
  const lines = description.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 兼容中文冒号和英文冒号进行键值切分
    const match = trimmed.match(/^([^：:]+)[：:](.*)$/);
    if (match) {
      const rawKey = match[1];
      const val = match[2].trim();

      // 去除键里的所有空白字符（包括中英文空格），并将中文全角括号统一洗成英文半角括号进行精准匹配
      const cleanKey = rawKey
        .replace(/\s+/g, '')
        .replace(/（/g, '(')
        .replace(/）/g, ')');

      if (maps[cleanKey]) {
        dto[maps[cleanKey]] = val as any;
      }
    }
  }
  return dto;
};

// 执行工单导入及字段转换逻辑
const handleImport = async (row: any) => {
  importingId.value = row.id;
  try {
    // 1. 解析描述体
    const dto = parseDescription(row.description || '');

    // 2. 补齐工单带出的基础关键数据（如果描述没有提取到，使用列表行数据兜底）
    if (!dto.companyName) dto.companyName = row.customerName || '';
    if (!dto.contactPhone) dto.contactPhone = row.contactPhone || '';
    if (!dto.riderName) dto.riderName = row.contactName || '';

    // 3. 收集附件，拼接下载路径并充当影像资料
    const imageUrls: string[] = [];
    if (row.records && Array.isArray(row.records)) {
      for (const rec of row.records) {
        if (rec.attachments && Array.isArray(rec.attachments)) {
          for (const att of rec.attachments) {
            // 目前全附件统一拼接下载接口 URL
            imageUrls.push(`${apiBase}/api/work-orders/attachments/${att.id}`);
          }
        }
      }
    }
    dto.imageUrls = imageUrls;

    // 4. 调用主系统提供的转换转换接口
    const apiDto: WorkOrderImportDto = {
      companyName: dto.companyName || '',
      cityName: dto.cityName || '',
      stopName: dto.stopName || '',
      stopOwnerName: dto.stopOwnerName || '',
      contactPhone: dto.contactPhone || '',
      riderId: dto.riderId || '',
      riderName: dto.riderName || '',
      riderIdCard: dto.riderIdCard || '',
      riderPhone: dto.riderPhone || '',
      accidentTime:
        dto.accidentTime || moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      accidentAddress: dto.accidentAddress || '',
      accidentDesc: dto.accidentDesc || '',
      injuryPart: dto.injuryPart || '',
      thirdPartyInfo: dto.thirdPartyInfo || '',
      hospitalName: dto.hospitalName,
      isHospitalized: dto.isHospitalized || '否',
      treatmentAmount: dto.treatmentAmount,
      policeOrLiability: dto.policeOrLiability,
      imageUrls: dto.imageUrls,
    };

    const res = await importFromWorkOrderApi(apiDto);
    if (res) {
      ElMessage.success('工单数据转换成功，开始自动填充页面字段！');
      emit('import-success', {
        ...res,
        stopOwnerName: apiDto.stopOwnerName,
        stopOwnerPhone: apiDto.contactPhone,
        riderId: apiDto.riderId,
      });
      visible.value = false;
    }
  } catch (error: any) {
    console.error('导入工单失败', error);
    ElMessage.error(`工单解析与转换失败: ${error.message || error}`);
  } finally {
    importingId.value = null;
  }
};
</script>

<style scoped>
.work-order-import-dialog :deep(.el-dialog__body) {
  padding-top: 5px;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}
.work-order-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
