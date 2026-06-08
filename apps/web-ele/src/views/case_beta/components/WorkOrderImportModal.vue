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
  ElImage,
  ElLink,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTag,
} from 'element-plus';
import moment from 'moment';

import { importFromWorkOrderApi } from '#/api/core/case-record';
import { requestClient } from '#/api/request';

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

// 工单系统接口基础路径，优先从环境变量读取
const apiBase = import.meta.env.VITE_WORKORDER_API_URL || '/workorder-api';
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

// 提取工单关联的全部附件（包含顶层附件与操作历史里的附件）
const getAllAttachments = (row: any) => {
  if (!row) return [];
  const list: any[] = [];
  if (row.attachments && Array.isArray(row.attachments)) {
    list.push(...row.attachments);
  }
  if (row.records && Array.isArray(row.records)) {
    for (const rec of row.records) {
      if (rec.attachments && Array.isArray(rec.attachments)) {
        list.push(...rec.attachments);
      }
    }
  }

  // 根据 id 进行去重
  const seen = new Set();
  return list.filter((item) => {
    if (!item || !item.id) return false;
    const isDup = seen.has(item.id);
    seen.add(item.id);
    return !isDup;
  });
};

// 判断附件是否为图片格式
const isImageAttachment = (att: any) => {
  if (att.isImage === true) return true;
  if (att.mimeType && att.mimeType.startsWith('image/')) return true;
  const fileName = (att.fileName || '').toLowerCase();
  return (
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.gif') ||
    fileName.endsWith('.webp')
  );
};

// 并发测试文件可用性，彻底过滤损坏链接，防止将坏链传给后端造成后端中转崩溃
const checkAttachmentActive = async (localUrl: string) => {
  try {
    // 优先使用 HEAD 请求快速校验网络可用性
    const res = await fetch(localUrl, { method: 'HEAD' });
    if (res.ok) return true;

    // 部分服务器不支持 HEAD 时，使用 GET 进行最终连通性校验
    const getRes = await fetch(localUrl);
    return getRes.ok;
  } catch (error) {
    console.warn(`本地拉取附件连通性检测失败，已自动跳过:`, localUrl, error);
    return false;
  }
};

// 将字节大小格式化为可读的文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
};

// 前端直接将外部图片转存上传到主系统的服务器中
const uploadToMainSystem = async (localUrl: string, fileName: string) => {
  try {
    const response = await fetch(localUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败，状态码: ${response.status}`);
    }
    const blob = await response.blob();
    const file = new File([blob], fileName, {
      type: blob.type || 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl =
      import.meta.env.VITE_UPLOAD_URL || '/api/member/uploadPicture';
    const uploadRes: any = await requestClient.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      baseURL: '',
    });

    const fileUrl =
      uploadRes && typeof uploadRes === 'object' && 'result' in uploadRes
        ? uploadRes.result
        : uploadRes;

    return {
      url: fileUrl,
      size: blob.size,
    };
  } catch (error) {
    console.error(`上传工单附件到主系统失败: ${localUrl}`, error);
    throw error;
  }
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

    // 3. 收集并清洗所有工单附件，在前端将图片转存至主系统
    const allAtts = getAllAttachments(row);
    const uploadedFiles: any[] = [];

    // 运行前端校验器过滤并转存图片文件
    const uploadPromises = allAtts
      .filter((att) => isImageAttachment(att))
      .map(async (att) => {
        // 优先抓取预览 preview url（成功率高），其次降级 downloadUrl
        const localUrl = att.url
          ? `${apiBase}${att.url}`
          : att.downloadUrl
            ? `${apiBase}${att.downloadUrl}`
            : `${apiBase}/api/work-orders/attachments/${att.id}`;

        // 使用前端极速健康检查，排除工单系统中 500 的废弃坏链
        const isActive = await checkAttachmentActive(localUrl);
        if (isActive) {
          try {
            const fileName = att.fileName || `工单影像-${att.id}.jpg`;
            const uploadResult = await uploadToMainSystem(localUrl, fileName);
            if (uploadResult && uploadResult.url) {
              uploadedFiles.push({
                url: uploadResult.url,
                title: fileName,
                fileSize: formatFileSize(uploadResult.size),
                cateName: '工单影像资料',
                cateId: '',
              });
            }
          } catch (error) {
            console.warn(`转存工单图片失败，自动跳过: ${localUrl}`, error);
          }
        } else if (att.url && att.downloadUrl) {
          // 如果预览链接失败，尝试用下载链接做一次二级降级兜底检测与转存
          const backupLocalUrl = `${apiBase}${att.downloadUrl}`;
          const isBackupActive = await checkAttachmentActive(backupLocalUrl);
          if (isBackupActive) {
            try {
              const fileName = att.fileName || `工单影像-${att.id}.jpg`;
              const uploadResult = await uploadToMainSystem(
                backupLocalUrl,
                fileName,
              );
              if (uploadResult && uploadResult.url) {
                uploadedFiles.push({
                  url: uploadResult.url,
                  title: fileName,
                  fileSize: formatFileSize(uploadResult.size),
                  cateName: '工单影像资料',
                  cateId: '',
                });
              }
            } catch (error) {
              console.warn(
                `转存工单图片(降级)失败，自动跳过: ${backupLocalUrl}`,
                error,
              );
            }
          }
        }
      });

    await Promise.all(uploadPromises);

    // 4. 调用主系统提供的转换接口（由后端在服务器进行数据转换）
    // 注意：我们将 imageUrls 传空数组 []，防止后端二次转存造成重复 4 张图片的问题
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
      imageUrls: [], // 切断后端下载，防止多出一份重复图片
    };

    const res = await importFromWorkOrderApi(apiDto);
    if (res) {
      // 5. 将前端转存成功后的主系统图片集合覆盖后端返回的空文件集合，达到完美回填效果
      res.files = uploadedFiles;

      ElMessage.success('工单数据转换成功，已成功回填数据与工单图片资料！');
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

      <!-- 工单图片附件预览（新增） -->
      <div
        class="mt-5"
        v-if="getAllAttachments(activeRow).some(isImageAttachment)"
      >
        <div class="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          工单图片附件
        </div>
        <div
          class="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div
            v-for="att in getAllAttachments(activeRow).filter(
              isImageAttachment,
            )"
            :key="att.id"
            class="group relative flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-2 transition-shadow hover:shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <ElImage
              :src="
                att.url
                  ? `${apiBase}${att.url}`
                  : att.downloadUrl
                    ? `${apiBase}${att.downloadUrl}`
                    : `${apiBase}/api/work-orders/attachments/${att.id}`
              "
              :preview-src-list="
                getAllAttachments(activeRow)
                  .filter((a) => isImageAttachment(a))
                  .map((a) =>
                    a.url
                      ? `${apiBase}${a.url}`
                      : a.downloadUrl
                        ? `${apiBase}${a.downloadUrl}`
                        : `${apiBase}/api/work-orders/attachments/${a.id}`,
                  )
              "
              fit="cover"
              class="h-24 w-full rounded-md"
              preview-teleported
            />
            <div
              class="mt-1.5 w-full truncate text-center text-xs text-slate-500"
              :title="att.fileName"
            >
              {{ att.fileName }}
            </div>
          </div>
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
                  :href="
                    att.downloadUrl
                      ? `${apiBase}${att.downloadUrl}`
                      : att.url
                        ? `${apiBase}${att.url}`
                        : `${apiBase}/api/work-orders/attachments/${att.id}`
                  "
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
