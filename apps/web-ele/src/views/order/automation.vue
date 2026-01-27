<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { alert, confirm, Page, prompt, useVbenModal } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import {
  ElButton,
  ElDivider,
  ElLink,
  ElMessage,
  ElPagination,
  ElProgress,
  ElTable,
  ElTableColumn,
  ElText,
} from 'element-plus';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import moment from 'moment';

import {
  TaskAddApi,
  TaskCodeScanApi,
  TaskCodeSendApi,
  TaskGetApi,
  TaskLogApi,
  TaskOrdersApi,
  TaskPostListApi,
} from '#/api/core/task';
import { getPdfFileName } from '#/utils/formatPdfUrl';

const router = useRouter();

interface LogListType {
  id: number;
  jobId: number;
  dt: string;
  tag: number;
  orderCount: number;
  policyCount: number;
  policySuccessCount: number;
  policyFailCount: number;
  taskList: any[];
  customerCount: number;
  peopleCount: number;
  phone: string;
}

interface TaskOrderListType {
  orderId: string;
  orderSn: string;
  customerName: string;
  peoplecount: number;
  consignTime: string;
  endTime: string;
}

const loading = ref<boolean>(false);
const insruePhone = ref('');
const downloadProgress = ref<number>(0);
const showProgress = ref<boolean>(false);

const taskAdd = async () => {
  // const { list } = await TaskChromeStatusApi({
  //   page: 1,
  //   size: 1,
  // });
  // if (list.length > 0) {
  //   alert(`当前有任务运行中，预计剩余时间：${list[0].leftTime}分钟`);
  //   return;
  // }
  prompt({
    componentProps: {
      type: 'number',
      placeholder: '请输入手机号',
    },
    beforeClose: async (scope): Promise<boolean> => {
      if (scope.isConfirm === true) {
        if (!scope.value) {
          ElMessage.error('请输入手机号');
          return false;
        }
        // 手机号格式校验
        const phoneReg = /^1[3-9]\d{9}$/;
        if (!phoneReg.test(scope.value)) {
          ElMessage.error('请输入正确的手机号');
          return false;
        }
      }
      return true;
    },
    content: '确定要开始今日投保吗？',
  })
    .then((val) => {
      insruePhone.value = val;
      getTaskOrders(val);
    })
    .catch(() => {});
};

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  centered: true,
  closeOnClickModal: false,
  closeOnPressEscape: false,
  fullscreenButton: false,
  onConfirm: () => {
    loading.value = true;
    modalApi.close();
    beginTask(insruePhone.value);
  },
});

const tableData = ref<TaskOrderListType[]>([]);

const getTaskOrders = async (phone: string) => {
  const { list } = await TaskOrdersApi({
    page: 1,
    size: 100,
    phone,
  });
  tableData.value = list;
  modalApi.open();
};

const beginTask = async (phone: string) => {
  try {
    await TaskAddApi(phone);

    const taskPoller = await pollTaskStatus();
    // 开始轮询
    taskPoller.start();

    // 轮询检查任务状态
    const checkStatus = async () => {
      const result = await TaskCodeScanApi(phone);
      if (result === 1) {
        loading.value = false;
        sendMsg();
      } else {
        // 继续轮询
        setTimeout(checkStatus, 2000); // 每2秒检查一次
      }
    };

    // 开始轮询
    checkStatus();
  } catch {
    insruePhone.value = '';
    loading.value = false;
  }
};

const sendMsg = () => {
  prompt({
    componentProps: {
      placeholder: '请输入验证码',
    },
    beforeClose: async (scope): Promise<boolean> => {
      if (scope.isConfirm === false) {
        const confirmCancel = await confirm({
          content: '取消后将暂时无法进行自动投保，确认要取消吗？',
          icon: 'warning',
        })
          .then(() => {
            return true;
          })
          .catch(() => {});
        return confirmCancel === true;
      } else if (scope.isConfirm === true && !scope.value) {
        ElMessage.error('请输入验证码');
        return false;
      }
      return true;
    },
    content: '请输入手机验证码',
  })
    .then(async (val) => {
      await TaskCodeSendApi(val, insruePhone.value);
      alert('验证成功！ 请关注历史日志');
      insruePhone.value = '';

      const taskPoller = await pollTaskStatus();
      // 开始轮询
      taskPoller.start();
    })
    .catch(() => {});
};

const pollTaskStatus = async (interval = 2000) => {
  // 创建一个轮询ID，用于停止轮询
  const pollId = ref<NodeJS.Timeout | null>(null);

  // 停止轮询的函数
  const stopPolling = () => {
    if (pollId.value) {
      clearInterval(pollId.value);
      pollId.value = null;
    }
  };

  // 开始轮询
  const startPolling = () => {
    // 先执行一次
    checkTaskStatus();

    // 设置定时器，定期检查状态
    pollId.value = setInterval(async () => {
      await checkTaskStatus();
    }, interval);
  };

  // 检查任务状态
  const checkTaskStatus = async () => {
    try {
      const { status, remark } = await TaskGetApi();

      loading.value = false;
      // 根据状态处理
      switch (status) {
        case 0: {
          // 运行中
          // 继续轮询
          break;
        }
        case 1: {
          // 运行成功
          alert('自动投保运行成功');
          stopPolling();
          getTaskList(); // 刷新列表
          break;
        }
        case 2: {
          // 运行异常结束
          alert(`自动投保运行异常结束，异常结束原因：${remark}`);
          stopPolling();
          getTaskList(); // 刷新列表
          break;
        }
        case 3: {
          // 暂停
          alert('自动投保已暂停');
          stopPolling();
          getTaskList(); // 刷新列表
          break;
        }
        case 4: {
          // 未启动
          // 可以选择是否停止轮询
          break;
        }
        default: {
          console.warn('未知状态:', status);
        }
      }
    } catch (error) {
      console.error('获取任务状态失败:', error);
      ElMessage.error('获取任务状态失败');
      stopPolling();
    }
  };

  // 返回控制函数
  return {
    start: startPolling,
    stop: stopPolling,
  };
};

const taskList = ref<LogListType[]>([]);
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const total = ref<number>(0);

const getTaskList = async () => {
  try {
    const { list, total: totalCount } = await TaskLogApi({
      page: currentPage.value,
      size: pageSize.value,
    });

    // 更新总数
    total.value = totalCount || 0;

    // 创建一个Promise数组来处理所有异步操作
    const promises = list.map(async (item) => {
      item.taskList = item.tag === 1 ? await getTaskPostList(item.jobId) : [];
      return item;
    });

    // 等待所有Promise完成
    const updatedList = await Promise.all(promises);

    // 更新响应式数据
    taskList.value = updatedList;
  } catch {
    ElMessage.error('获取任务列表失败');
  }
};

// 处理每页显示数量变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
  getTaskList();
};

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  getTaskList();
};

const formatDateTime = (dateTime: string) => {
  return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

const formatDate = (dateTime: string) => {
  return moment(dateTime).format('YYYY-MM-DD');
};

const getTaskPostList = async (id: number | string) => {
  const { list } = await TaskPostListApi({
    jobId: id,
    page: 1,
    size: 100,
  });
  return list;
};

const goPhone = () => {
  router.push('/order/phone');
};

const downloadAllPdf = async (logItem: LogListType, jobId: number | string) => {
  loading.value = true;
  showProgress.value = true;
  downloadProgress.value = 0;
  let successCount = 0;

  try {
    // 从接口读取最新的投保记录
    const { list: latestTaskList } = await TaskPostListApi({
      jobId,
      page: 1,
      size: 100,
    });

    // 检查是否有状态为0或1的记录，如果有则禁止批量下载
    const hasPendingTasks =
      Array.isArray(latestTaskList) &&
      latestTaskList.some((task) => {
        const statusVal = Number(task && task.status);
        return statusVal === 0 || statusVal === 1;
      });
    if (hasPendingTasks) {
      ElMessage.error('检测到有记录正在投保中或等待投保，请稍后再试');
      loading.value = false;
      showProgress.value = false;
      return;
    }

    // 检查是否有状态为2但pdf为空（或为字符串 'null'）的记录
    const hasInvalidSuccessTasks =
      Array.isArray(latestTaskList) &&
      latestTaskList.some((task) => {
        const statusVal = Number(task && task.status);
        const pdfVal = task && task.pdf !== null ? String(task.pdf).trim() : '';
        const isInvalid = statusVal === 2 && (!pdfVal || pdfVal === 'null');
        return isInvalid;
      });
    if (hasInvalidSuccessTasks) {
      ElMessage.error('检测到有投保成功但PDF文件未生成完成的记录，请稍后再试');
      loading.value = false;
      showProgress.value = false;
      return;
    }

    // 过滤出可以下载的任务：状态为2且有有效pdf
    const validTasks = (
      Array.isArray(latestTaskList) ? latestTaskList : []
    ).filter((task) => {
      const statusVal = Number(task && task.status);
      const pdfVal = task && task.pdf !== null ? String(task.pdf).trim() : '';
      return statusVal === 2 && !!pdfVal && pdfVal !== 'null';
    });
    const totalTasks = validTasks.length;

    if (totalTasks === 0) {
      throw new Error('没有可下载的PDF文件');
    }

    const zip = new JSZip();

    for (const [index, task] of validTasks.entries()) {
      try {
        // 使用原生fetch替代requestClient，避免拦截器影响blob响应处理
        const response = await fetch(task.pdf, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${useAccessStore().accessToken}`,
            'Accept-Language': preferences.app.locale,
          },
          credentials: 'include', // 包含cookie等凭证
        });

        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        // 获取blob数据
        const blobData = await response.blob();

        // 检查blob数据是否有效
        if (!blobData || blobData.size === 0) {
          throw new Error('获取的PDF数据为空');
        }

        // 添加到zip文件
        const fileName =
          getPdfFileName(task.pdf) || `document_${Date.now()}.pdf`;
        zip.file(fileName, blobData);
        successCount++;
      } catch (pdfError) {
        console.error(`下载单个PDF失败: ${task.pdf}`, pdfError);
      } finally {
        // 更新进度条
        downloadProgress.value = Math.round(((index + 1) / totalTasks) * 100);
      }
    }

    // 检查是否有文件添加到zip
    if (Object.keys(zip.files).length === 0) {
      throw new Error('没有成功下载任何PDF文件');
    }

    // 生成zip文件并下载
    const content = await zip.generateAsync({ type: 'blob' });
    const dateStr = logItem.dt ? moment(logItem.dt).format('YYYYMMDD') : '';
    saveAs(content, `${dateStr} 保单.zip`);
    ElMessage.success(`成功下载${successCount}个文件`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '下载发生错误';
    ElMessage.error(`下载失败: ${errorMsg}，请稍后再试或单独下载相应文件`);
    console.error('打包下载失败', error);
  } finally {
    // 延迟隐藏进度条，让用户看到100%的完成状态
    loading.value = false;
    setTimeout(() => {
      showProgress.value = false;
      downloadProgress.value = 0;
    }, 500);
  }
};

onMounted(() => {
  getTaskList();
});

watch(loading, (newVal) => {
  document.body.style.overflow = newVal ? 'hidden' : '';
});
</script>

<template>
  <Page title="自动投保">
    <template #extra>
      <ElLink type="primary" class="mr-4" @click="goPhone">
        管理自动投保手机号
      </ElLink>
      <ElButton type="primary" size="large" @click="taskAdd" :loading="loading">
        开始今日投保
      </ElButton>
    </template>

    <Modal class="w-[900px]" title="今日待投保订单">
      <ElTable :data="tableData" border style="width: 100%">
        <ElTableColumn
          prop="orderId"
          label="订单编号"
          align="center"
          width="150"
        />
        <ElTableColumn
          prop="orderSn"
          label="订单别名"
          align="center"
          width="150"
        />
        <ElTableColumn
          prop="customerName"
          label="客户名称"
          align="center"
          min-width="180"
        />
        <ElTableColumn
          prop="peoplecount"
          label="投保人数"
          align="center"
          width="100"
        />
        <ElTableColumn
          prop="consignTime"
          label="起保日期"
          align="center"
          width="120"
        >
          <template #default="{ row }">
            {{ formatDate(row.consignTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="endTime"
          label="终保日期"
          align="center"
          width="120"
        >
          <template #default="{ row }">
            {{ formatDate(row.endTime) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </Modal>

    <div
      v-show="loading"
      v-loading="loading"
      element-loading-text="处理中，请勿关闭页面"
      class="absolute left-0 top-0 z-50 w-full bg-gray-900/20"
      style="height: calc(100vh - 88px)"
    ></div>

    <!-- 进度条 -->
    <div
      v-show="showProgress"
      class="animate-fadeIn fixed left-1/2 top-1/3 z-50 w-1/2 -translate-x-1/2 transform rounded-lg bg-white p-8 shadow-xl transition-all duration-300 dark:bg-gray-800"
    >
      <h3 class="mb-6 text-xl font-bold text-primary dark:text-primary">
        <i class="el-icon-download mr-2"></i>正在下载保单文件...
      </h3>
      <ElProgress
        :percentage="downloadProgress"
        status="success"
        :stroke-width="20"
        text-inside
      />
      <p class="mt-6 text-base font-medium text-gray-700 dark:text-gray-300">
        当前进度：<span class="text-primary">{{ downloadProgress }}%</span>
      </p>
      <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        请稍候，文件正在打包中...
      </div>
    </div>

    <!-- 背景遮罩 -->
    <div
      v-show="showProgress"
      class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm dark:bg-black/50"
    ></div>

    <div
      class="title mb-4 mt-6 flex items-center text-lg font-bold dark:text-gray-200"
    >
      <div class="mr-2 h-4 w-1 rounded bg-primary"></div>
      历史日志
    </div>
    <div
      class="log-container rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800"
    >
      <div v-for="item in taskList" :key="item.id">
        <div
          class="log-item mb-4 rounded-md p-4 transition-all hover:shadow-md"
          :class="[
            item.tag === 0
              ? 'border-l-4 border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : 'border-l-4 border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/20',
          ]"
        >
          <div class="log-time mb-2 text-sm text-gray-500 dark:text-gray-400">
            <i class="el-icon-time mr-1"></i>{{ formatDateTime(item.dt) }}
          </div>
          <div v-if="item.tag === 0" class="log-content">
            <span class="text-base font-medium dark:text-gray-200">
              今日投保任务开始
            </span>
            <div class="mt-2 flex flex-wrap gap-6">
              <span class="inline-flex items-center">
                <span class="mr-1 text-blue-500 dark:text-blue-400">
                  待投保订单数:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.orderCount }}
                </span>
              </span>
              <span class="inline-flex items-center">
                <span class="mr-1 text-blue-500 dark:text-blue-400">
                  预计保单数:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.policyCount }}
                </span>
              </span>
              <span class="inline-flex items-center">
                <span class="mr-1 text-blue-500 dark:text-blue-400">
                  客户数:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.customerCount }}
                </span>
              </span>
              <span class="inline-flex items-center">
                <span class="mr-1 text-blue-500 dark:text-blue-400">
                  总被保险人人数:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.peopleCount }}
                </span>
              </span>
              <span class="inline-flex items-center">
                <span class="mr-1 text-blue-500 dark:text-blue-400">
                  操作手机号:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.phone }}
                </span>
              </span>
            </div>
          </div>
          <div v-else-if="item.tag === 1" class="log-content">
            <span class="text-base font-medium dark:text-gray-200">
              今日投保任务完成
            </span>
            <div class="mt-2 flex flex-wrap gap-6">
              <span class="inline-flex items-center">
                <span class="mr-1 text-green-500 dark:text-green-400">
                  投保成功保单数:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.policySuccessCount }}/{{ item.policyCount }}
                </span>
              </span>
              <span class="inline-flex items-center">
                <span class="mr-1 text-red-500 dark:text-red-400">
                  未成功保单数:
                </span>
                <span class="font-bold dark:text-gray-200">
                  {{ item.policyFailCount || 0 }}
                </span>
              </span>
              <ElButton
                type="primary"
                @click="downloadAllPdf(item, item.jobId)"
              >
                批量下载当日保单
              </ElButton>
            </div>
            <div
              class="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              v-if="item.policyFailCount > 0"
            >
              <i class="el-icon-warning mr-1"></i>以下未成功投保数据请手动投保。
            </div>
          </div>
        </div>
        <div class="mb-6 mt-2" v-if="item.tag === 1">
          <div class="vp-raw w-full">
            <ElTable
              :data="item.taskList"
              style="width: 100%"
              border
              stripe
              highlight-current-row
              class="rounded-md dark:border-gray-700 dark:bg-gray-800"
              max-height="80vh"
            >
              <ElTableColumn prop="seq" label="操作编号" min-width="220" />
              <ElTableColumn
                prop="uuid"
                label="所属保单系统编码"
                min-width="200"
              />
              <ElTableColumn
                prop="customerName"
                label="所属客户"
                min-width="200"
              />
              <ElTableColumn prop="tbr" label="投保人" min-width="200" />
              <ElTableColumn prop="num" label="人数" min-width="100" />
              <ElTableColumn prop="beginTime" label="操作时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.created) }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                prop="policy.bxfa"
                label="方案名"
                min-width="140"
              />
              <ElTableColumn
                prop="policy.bxbh"
                label="方案类型"
                min-width="100"
              >
                <template #default="{ row }">
                  {{ row.policy?.type === 0 ? '主险' : '附加险' }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                prop="policy.bxfaId"
                label="方案id"
                min-width="80"
              />
              <ElTableColumn prop="status" label="状态" min-width="120">
                <template #default="{ row }">
                  <ElText v-if="row.status === 0" type="primary">
                    <i class="el-icon-time mr-1"></i>待投保
                  </ElText>
                  <ElText v-else-if="row.status === 1" type="warning">
                    <i class="el-icon-loading mr-1"></i>投保中
                  </ElText>
                  <ElText v-else-if="row.status === 2" type="success">
                    <i class="el-icon-check mr-1"></i>投保成功
                  </ElText>
                  <ElText v-else-if="row.status === 3" type="danger">
                    <i class="el-icon-close mr-1"></i>投保失败
                  </ElText>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="feedback" label="反馈" min-width="180" />
              <ElTableColumn prop="download" label="模版名单" min-width="150">
                <template #default="{ row }">
                  <ElLink
                    underline="always"
                    type="primary"
                    :href="row.excelUrl"
                    target="_blank"
                    v-if="row.excelUrl"
                  >
                    <i class="el-icon-download mr-1"></i>模版名单
                  </ElLink>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </div>
        <ElDivider v-if="item.tag === 0" class="dark:border-gray-700" />
      </div>
      <div
        v-if="taskList.length === 0"
        class="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400"
      >
        <i class="el-icon-document mr-2 text-xl"></i>暂无历史日志数据
      </div>
    </div>
    <div class="flex justify-end pb-4 pt-6" v-if="taskList.length > 0">
      <ElPagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        :page-sizes="[10, 20]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </Page>
</template>
