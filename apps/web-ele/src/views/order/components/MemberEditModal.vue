<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserIdStore } from '@vben/stores';

import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

import { OrderUpdateApi } from '#/api/core/order';

interface Data {
  id: number | string;
  username: string;
  creditcard: string;
  orderId: number | string;
  bxbm: string;
  comment: string;
  comment2: string;
  stopName: string;
  idNum: string;
  orderInfo?: any;
}

const emit = defineEmits(['reloadList']);
const useridStore = useUserIdStore();

const formModel = ref<Data>({
  id: '',
  username: '',
  creditcard: '',
  orderId: '',
  bxbm: '',
  comment: '',
  comment2: '',
  stopName: '',
  idNum: '',
});

const formRef = ref<any>(null);

const rules = {
  username: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (/^[\u4E00-\u9FA5·]{2,16}$/.test(value)) {
          callback();
        } else {
          callback(new Error('姓名格式不正确'));
        }
      },
      trigger: 'blur',
    },
  ],
  creditcard: [
    { required: true, message: '请输入身份证', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (
          /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[12]\d|30|31)\d{3}[\dX]$/i.test(
            value,
          )
        ) {
          callback();
        } else {
          callback(new Error('身份证格式不正确'));
        }
      },
      trigger: 'blur',
    },
  ],
};

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    try {
      await formRef.value?.validate();
      modalApi.setState({ confirmLoading: true });
      await OrderUpdateApi({
        id: Number(formModel.value.orderId),
        consignTime: formModel.value.orderInfo?.consignTime,
        memberDtos: [
          {
            id: Number(formModel.value.id),
            operateTag: 0,
            username: formModel.value.username,
            creditcard: formModel.value.creditcard,
            bxbm: formModel.value.bxbm,
            comment: formModel.value.comment,
            comment2: formModel.value.comment2,
            stopName: formModel.value.stopName,
            idNum: formModel.value.idNum,
            userid: useridStore.userId as number,
          },
        ],
      });
      ElMessage.success('修改成功');
      emit('reloadList');
      modalApi.close();
    } catch {
      // validation error
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const { row, orderId, orderInfo } =
        modalApi.getData<Record<string, any>>();
      formModel.value = {
        id: row.id,
        username: row['姓名'] || row.username,
        creditcard: row['身份证'] || row.creditcard,
        bxbm: row['保险编码'] || row.bxbm,
        comment: row['备注1'] || row.comment,
        comment2: row['备注2'] || row.comment2,
        stopName: row['所属站点名称'] || row.stopName,
        idNum: row['骑手编号'] || row.idNum,
        orderId,
        orderInfo,
      };
      // Configure modal title dynamically
      modalApi.setState({
        title: `人员信息修订 - ${formModel.value.username}`,
      });
    }
  },
});
</script>

<template>
  <Modal title="人员信息修订">
    <div class="p-5">
      <ElForm
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-width="100px"
      >
        <ElFormItem label="姓名" prop="username">
          <ElInput v-model="formModel.username" placeholder="请输入姓名" />
        </ElFormItem>
        <ElFormItem label="身份证号" prop="creditcard">
          <ElInput
            v-model="formModel.creditcard"
            placeholder="请输入身份证号"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
