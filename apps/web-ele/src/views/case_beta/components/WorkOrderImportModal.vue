<script lang="ts" setup>
import type { WorkOrderImportDto } from '#/api/core/case-record';

import { ref, watch } from 'vue';

import { Refresh } from '@element-plus/icons-vue';
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElLink,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { importFromWorkOrderApi } from '#/api/core/case-record';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'importSuccess', data: any): void;
}>();

const visible = ref(false);
const loading = ref(false);
const importingId = ref<null | number>(null);

// 线上测试环境工单系统固定地址，开发环境通过 Vite 代理避开 CORS 限制，生产环境直接请求完整线上地址
const apiBase = import.meta.env.DEV
  ? '/workorder-api'
  : 'http://124.222.12.38/workorder';
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
      row._data = row.claimData || parseDescription(row.description || '');
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
      const rawKey = match[1] || '';
      const val = (match[2] || '').trim();

      // 去除键里的所有空白字符（包括中英文空格），并将中文全角括号统一洗成英文半角括号进行精准匹配
      const cleanKey = rawKey
        .replaceAll(/\s+/g, '')
        .replaceAll('（', '(')
        .replaceAll('）', ')');

      if (maps[cleanKey]) {
        dto[maps[cleanKey]] = val as any;
      }
    }
  }
  return dto;
};

// 详情 Dialog 弹窗状态控制
const activeRow = ref<any>(null);
const detailVisible = ref(false);

const showDetail = (row: any) => {
  activeRow.value = row;
  detailVisible.value = true;
};

// 执行工单导入及字段转换逻辑
const handleImport = async (row: any) => {
  importingId.value = row.id;
  try {
    // 1. 获取统一的解析数据，首选后端直传的数据
    const dto = { ...row._data };

    // 2. 补齐工单带出的基础关键数据（如果未提取到，使用列表行数据兜底）
    if (!dto.companyName) dto.companyName = row.customerName || '';
    if (!dto.contactPhone) dto.contactPhone = row.contactPhone || '';
    if (!dto.riderName) dto.riderName = row.contactName || '';

    // 3. 收集附件，拼接下载路径并充当影像资料
    const imageUrls: string[] = [];
    if (dto.imageUrls && Array.isArray(dto.imageUrls)) {
      imageUrls.push(...dto.imageUrls);
    }
    if ((dto as any).caseFiles && Array.isArray((dto as any).caseFiles)) {
      imageUrls.push(...(dto as any).caseFiles);
    }
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
    dto.imageUrls = [...new Set(imageUrls.filter(Boolean))];

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
      emit('importSuccess', {
        ...res,
        stopOwnerName: apiDto.stopOwnerName,
        stopOwnerPhone: apiDto.contactPhone,
        riderId: apiDto.riderId,
      });
      visible.value = false;
      detailVisible.value = false;
    }
  } catch (error: any) {
    console.error('导入工单失败', error);
    ElMessage.error(`工单解析与转换失败: ${error.message || error}`);
  } finally {
    importingId.value = null;
  }
};
</script>

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
                  {{ row._data?.riderName || row.contactName || '-' }}
                </span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >出险时间：</span
                >
                <span class="text-slate-700 dark:text-slate-200">{{
                  row._data?.accidentTime || '-'
                }}</span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >出险位置：</span
                >
                <span class="break-all text-slate-700 dark:text-slate-200">{{
                  row._data?.accidentAddress || '-'
                }}</span>
              </div>
              <div class="flex">
                <span class="w-24 flex-shrink-0 text-slate-400"
                  >所属客户：</span
                >
                <span class="text-slate-700 dark:text-slate-200">{{
                  row._data?.companyName || row.customerName || '-'
                }}</span>
              </div>
            </div>
          </div>

          <!-- 操作底部栏（查看详情与选择按钮） -->
          <div
            class="card-footer mt-4 flex items-center justify-between border-t border-slate-50 pt-3 dark:border-slate-800/40"
          >
            <ElLink
              type="primary"
              underline="never"
              class="text-xs font-semibold hover:text-indigo-600"
              @click="showDetail(row)"
            >
              查看详情
            </ElLink>
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
  </ElDialog>

  <!-- 理赔工单数据详情 Dialog -->
  <ElDialog
    v-model="detailVisible"
    title="理赔工单详细数据"
    width="780px"
    append-to-body
    destroy-on-close
    align-center
    class="work-order-detail-dialog"
  >
    <div class="detail-container pr-1" v-if="activeRow">
      <!-- 头部精美信息卡片 -->
      <div
        class="mb-5 flex items-center justify-between rounded-2xl border border-indigo-100/50 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 dark:border-slate-800 dark:from-slate-800/80 dark:to-slate-900/80"
      >
        <div>
          <div class="text-xs text-slate-400 dark:text-slate-500">工单号</div>
          <div class="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {{ activeRow.orderNo }}
          </div>
        </div>
        <div>
          <div class="text-right text-xs text-slate-400 dark:text-slate-500">
            创建时间
          </div>
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {{ formatTime(activeRow.createdAt) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400 dark:text-slate-500">状态</div>
          <div>
            <ElTag
              :type="
                activeRow.status === 'pending'
                  ? 'danger'
                  : activeRow.status === 'completed'
                    ? 'success'
                    : 'warning'
              "
              size="small"
            >
              {{
                activeRow.status === 'pending'
                  ? '待处理'
                  : activeRow.status === 'processing'
                    ? '处理中'
                    : activeRow.status === 'completed'
                      ? '已完成'
                      : '已取消'
              }}
            </ElTag>
          </div>
        </div>
      </div>

      <!-- 18个核心解析字段展示 -->
      <ElDescriptions
        :column="2"
        border
        title="理赔字段结构化数据"
        class="claim-detail-descriptions"
      >
        <ElDescriptionsItem label="骑手姓名">
          <span class="font-bold text-indigo-600 dark:text-indigo-400">{{
            activeRow._data?.riderName || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="骑手ID">
          <span class="font-mono text-slate-800 dark:text-slate-200">{{
            activeRow._data?.riderId || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="身份证号">
          <span class="font-mono text-slate-800 dark:text-slate-200">{{
            activeRow._data?.riderIdCard || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="骑手电话">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.riderPhone || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="所属客户" :span="2">
          <span class="font-semibold text-slate-800 dark:text-slate-200">{{
            activeRow._data?.companyName || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="城市名称">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.cityName || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="站点名称">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.stopName || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="站长姓名">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.stopOwnerName || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="联系电话">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.contactPhone || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="事发时间">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.accidentTime || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="事发地点">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.accidentAddress || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="事故经过" :span="2">
          <span class="leading-relaxed text-slate-600 dark:text-slate-300">{{
            activeRow._data?.accidentDesc || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="受伤部位">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.injuryPart || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="是否住院">
          <ElTag
            :type="activeRow._data?.isHospitalized === '是' ? 'danger' : 'info'"
            size="small"
          >
            {{ activeRow._data?.isHospitalized || '-' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="就诊医院" :span="2">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.hospitalName || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="预计治疗金额">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.treatmentAmount || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="涉及三者情况">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.thirdPartyInfo || '-'
          }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="报警与责任认定" :span="2">
          <span class="text-slate-800 dark:text-slate-200">{{
            activeRow._data?.policeOrLiability || '-'
          }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 原始描述文本 -->
      <div class="mt-5">
        <div class="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          工单原始描述文本
        </div>
        <div
          class="custom-scrollbar max-h-[160px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
        >
          {{ activeRow.description || '暂无原始描述' }}
        </div>
      </div>

      <!-- 处理记录与附件 -->
      <div
        class="mt-5"
        v-if="
          activeRow.records &&
          activeRow.records.some(
            (r: any) => r.attachments && r.attachments.length > 0,
          )
        "
      >
        <div class="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          工单处理记录与附件
        </div>
        <div class="space-y-3">
          <div
            v-for="record in activeRow.records"
            :key="record.id"
            class="rounded-xl border border-slate-100/80 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-900/30"
          >
            <div
              class="mb-1 flex items-center justify-between text-xs text-slate-400"
            >
              <span class="font-semibold text-slate-500"
                >处理人：{{ record.creator?.name || '未知' }}</span
              >
              <span>{{ formatTime(record.createdAt) }}</span>
            </div>
            <div
              class="mb-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {{ record.content }}
            </div>
            <div
              class="flex flex-wrap gap-2"
              v-if="record.attachments && record.attachments.length > 0"
            >
              <div
                v-for="att in record.attachments"
                :key="att.id"
                class="inline-flex items-center gap-1 rounded-lg border border-indigo-100/30 bg-indigo-50/60 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400"
              >
                <a
                  :href="`${apiBase}/api/work-orders/attachments/${att.id}`"
                  target="_blank"
                  download
                  class="flex items-center gap-1 text-inherit no-underline"
                >
                  <span>📎</span>
                  <span
                    >{{ att.fileName }} ({{
                      (att.fileSize / 1024).toFixed(1)
                    }}
                    KB)</span
                  >
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="detailVisible = false">关闭</ElButton>
        <ElButton
          type="primary"
          :loading="importingId === activeRow?.id"
          @click="handleImport(activeRow)"
        >
          选择该工单
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped>
.work-order-import-dialog :deep(.el-dialog__body) {
  padding-top: 5px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgb(148 163 184 / 30%);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}

.work-order-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.work-order-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  padding-top: 10px;
  overflow-y: auto;
}

.claim-detail-descriptions :deep(.el-descriptions__label) {
  width: 130px;
  font-weight: 600;
  color: #64748b;
  background-color: #f8fafc !important;
}

.dark .claim-detail-descriptions :deep(.el-descriptions__label) {
  color: #94a3b8;
  background-color: #0f172a !important;
}

.claim-detail-descriptions :deep(.el-descriptions__content) {
  color: #334155;
}

.dark .claim-detail-descriptions :deep(.el-descriptions__content) {
  color: #cbd5e1;
}
</style>
