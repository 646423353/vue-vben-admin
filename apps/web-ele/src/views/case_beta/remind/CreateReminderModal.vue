<script lang="ts" setup>
import type { CaseReminderApi } from '#/api/core/case-reminder';

import { ref } from 'vue';

import { useVbenForm, useVbenModal, z } from '@vben/common-ui';

import { ElMessage } from 'element-plus';
import moment from 'moment';

import { authUserListApi } from '#/api/core/authuser';
import { CaseRecordListApi } from '#/api/core/case-record';
import { createReminderApi } from '#/api/core/case-reminder';

defineOptions({ name: 'CreateReminderModal' });

const emit = defineEmits<{
  cancel: [];
  success: [];
}>();

// Form Schema
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const res = await authUserListApi({
            page: 1,
            size: 1000,
            organid: 0,
            roleId: '1,13,19,20,21,22' as any,
          });
          return (
            res?.list?.map((user: any) => ({
              label: `${user.description || user.nickName || user.username || '未知'} - ${user.username}`,
              value: user.userId || user.id,
            })) || []
          );
        },
        clearable: true,
        placeholder: '请选择催办接收人',
      },
      defaultValue: undefined,
      fieldName: 'receiver',
      label: '催办接收人',
      rules: z
        .number({
          required_error: '请选择催办接收人',
          invalid_type_error: '请选择催办接收人',
        })
        .min(1, { message: '请选择催办接收人' }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          try {
            const res = await CaseRecordListApi({}, { page: 1, size: 1000 });
            const list = res?.list || [];
            return list.map((item: any) => ({
              label: `${item.id}-${item.name || '未知'}`,
              value: item.id,
            }));
          } catch (error) {
            console.error('获取案件列表失败:', error);
            return [];
          }
        },

        filterable: true,
        multiple: true,
        placeholder: '请选择关联案件编号（可多选）',
      },
      fieldName: 'caseId',
      label: '关联案件编号',
    },
    {
      component: 'Select',
      componentProps: {
        multiple: true,
        options: [
          { label: '加速定损', value: '1' },
          { label: '尽快联系骑手', value: '2' },
          { label: '尽快联系保司', value: '3' },
          { label: '加快案件处理', value: '4' },
        ],
        placeholder: '请选择催办事件类型（可多选）',
      },
      fieldName: 'type',
      label: '催办事件类型',
    },
    {
      component: 'DatePicker',
      componentProps: {
        disabledDate: (time: Date) => {
          const oneHourLater = Date.now() + 60 * 60 * 1000;
          return time.getTime() < oneHourLater;
        },
        placeholder: '请选择截止时间（必须>1小时后）',
        showTime: true,
        style: { width: '100%' },
        type: 'datetime',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      defaultValue: moment(Date.now() + 60 * 65 * 1000).format(
        'YYYY-MM-DD HH:mm:ss',
      ),
      fieldName: 'endTime',
      label: '截止时间',
      rules: z.string().refine((val) => {
        if (!val) return false;
        const deadline = moment(val).valueOf();
        return deadline > Date.now() + 60 * 60 * 1000;
      }, '截止时间必须在1小时之后'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '普通', value: 1 },
          { label: '高', value: 2 },
          { label: '最高', value: 3 },
        ],
      },
      defaultValue: 1,
      fieldName: 'imp',
      label: '重要程度',
      rules: z.number({ message: '请选择重要程度' }),
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入催办内容',
        rows: 4,
        type: 'textarea',
      },
      fieldName: 'zt',
      formItemClass: 'items-start',
      label: '催办内容',
      rules: z.string().min(1, { message: '请输入催办内容' }),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const loading = ref(false);

const [Modal, modalApi] = useVbenModal({
  title: '新建催办',
  fullscreenButton: false,
  closeOnClickModal: false,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      formApi.resetForm();
    }
  },
});

async function handleSubmit() {
  try {
    await formApi.validate();
    const values = await formApi.getValues();

    // 处理type字段：数组转为逗号分隔字符串
    const submitData: CaseReminderApi.CreateReminderParams = {
      caseId: Array.isArray(values.caseId)
        ? values.caseId.join(',')
        : (values.caseId as string | undefined),
      endTime: values.endTime ? String(moment(values.endTime).valueOf()) : '',
      imp: values.imp as number,
      receiver: values.receiver as number,
      type: Array.isArray(values.type)
        ? values.type.join(',')
        : (values.type as string | undefined),
      zt: values.zt as string,
    };

    loading.value = true;
    modalApi.setState({ loading: true, confirmLoading: true });
    await createReminderApi(submitData);
    ElMessage.success('创建催办成功');
    emit('success');
    modalApi.close();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    loading.value = false;
    modalApi.setState({ loading: false, confirmLoading: false });
  }
}

defineExpose({
  formApi,
  handleSubmit,
  modalApi,
});
</script>

<template>
  <Modal>
    <div class="p-4">
      <Form />
    </div>
  </Modal>
</template>
