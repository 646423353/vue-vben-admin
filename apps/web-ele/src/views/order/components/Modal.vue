<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { MemberDto, OrderForm } from '../operate/detail.vue';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserIdStore } from '@vben/stores';

import {
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';
import moment from 'moment';

import { OrderUpdateApi } from '#/api/core/order';

interface MemberForm extends MemberDto {
  locationtype?: string;
  mainInsure?: string;
  addiInsure?: string;
  consignTime?: number | string;
  endTime?: number | string;
}

interface Props {
  orderInfo: OrderForm;
}

const props = defineProps<Props>();
const emit = defineEmits(['reloadList']);
const useridStore = useUserIdStore();

const orderInfo = props.orderInfo;

const memberFormRef = ref<FormInstance>();
const memberForm = reactive<MemberForm>({
  username: '',
  creditcard: '',
  bxbm: '',
  comment: '',
  comment2: '',
  userid: useridStore.userId as number,
  locationtype: '',
  mainInsure: '',
  addiInsure: '',
  consignTime: '',
  endTime: '',
});

const validateName = (rule: any, value: any, callback: any) => {
  if (!/^[\u4E00-\u9FA5·]{2,16}$/.test(value)) {
    return callback(new Error('姓名格式不正确'));
  }
  callback();
};

const validateCredit = (rule: any, value: any, callback: any) => {
  if (
    !/^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[12]\d|30|31)\d{3}[\dX]$/i.test(
      value,
    )
  ) {
    return callback(new Error('身份证格式不正确'));
  }
  callback();
};

const rules = reactive<FormRules<MemberForm>>({
  username: [
    {
      required: true,
      message: '请输入姓名',
      trigger: 'blur',
    },
    {
      validator: validateName,
      trigger: 'blur',
    },
  ],
  creditcard: [
    {
      required: true,
      message: '请输入身份证',
      trigger: 'blur',
    },
    {
      validator: validateCredit,
      trigger: 'blur',
    },
  ],
  locationtype: [{ required: true }],
  mainInsure: [{ required: true }],
  addiInsure: [{ required: true }],
  consignTime: [{ required: true }],
  endTime: [{ required: true }],
});

const id = ref<number | string>('');

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    resetForm(memberFormRef.value);
    id.value = '';
    modalApi.close();
  },
  onConfirm() {
    submitForm(memberFormRef.value);
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { id: orderId } = modalApi.getData<Record<string, any>>();
      id.value = orderId;
      memberForm.userid = useridStore.userId as number;
      memberForm.locationtype = orderInfo.locationtype as string;
      memberForm.mainInsure = orderInfo.mainInsure;
      memberForm.addiInsure = orderInfo.addiInsure;
      memberForm.consignTime =
        moment(orderInfo.consignTime).valueOf() > moment().valueOf()
          ? moment(orderInfo.consignTime).valueOf()
          : moment().add(1, 'days').valueOf();
      memberForm.endTime = orderInfo.endTime;
    }
  },
  title: '新建人员',
});

const back = () => {
  modalApi.close();
};

function resetForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  formEl.resetFields();
  memberForm.comment = '';
  memberForm.comment2 = '';
}

async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      const form = {
        bxbm: props.orderInfo.safetype as string,
        username: memberForm.username,
        creditcard: memberForm.creditcard,
        comment: memberForm.comment,
        comment2: memberForm.comment2,
        userid: memberForm.userid,
        operateTag: 1,
      };
      const result = await OrderUpdateApi({
        id: Number(id.value),
        consignTime: props.orderInfo?.consignTime,
        memberDtos: [form],
      });
      ElMessage.success(`${result}`);
      emit('reloadList');
      resetForm(formEl);
      id.value = '';
      back();
    } else {
      console.error('error submit!', fields);
    }
  });
}
</script>
<template>
  <Modal>
    <div class="p-4 pb-0">
      <ElForm
        ref="memberFormRef"
        :model="memberForm"
        :rules="rules"
        class="demo-memberForm"
        label-width="auto"
        status-icon
      >
        <ElFormItem label="姓名" prop="username">
          <ElInput v-model="memberForm.username" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="身份证" prop="creditcard">
          <ElInput v-model="memberForm.creditcard" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="保险编码" prop="locationtype">
          <ElInput
            :value="`${memberForm.locationtype} / ${memberForm.mainInsure} + ${memberForm.addiInsure}`"
            readonly
          />
        </ElFormItem>
        <ElFormItem label="主险" prop="mainInsure">
          <ElInput v-model="memberForm.mainInsure" readonly />
        </ElFormItem>
        <ElFormItem label="附加险" prop="addiInsure">
          <ElInput v-model="memberForm.addiInsure" readonly />
        </ElFormItem>
        <ElFormItem label="起保日期" prop="consignTime">
          <ElDatePicker v-model="memberForm.consignTime" readonly type="date" />
        </ElFormItem>
        <ElFormItem label="终保日期" prop="endTime">
          <ElDatePicker v-model="memberForm.endTime" readonly type="date" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="memberForm.comment" placeholder="请输入" />
        </ElFormItem>
        <ElFormItem label="备注2">
          <ElInput v-model="memberForm.comment2" placeholder="请输入" />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.el-form-item .el-date-editor) {
  width: 100%;
}
</style>
