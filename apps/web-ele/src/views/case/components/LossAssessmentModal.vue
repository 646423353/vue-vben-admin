<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

const formRef = ref();
const form = reactive({
  accidentType: [],
  liability: '',
  violationType: [],
  specialDetermination: [],
  remarks: '',
});

const rules = {
  accidentType: [
    { required: true, message: '请选择出险类型', trigger: 'change' },
  ],
  liability: [
    { required: true, message: '请选择事故责任判定', trigger: 'change' },
  ],
  violationType: [
    { required: true, message: '请选择事故违章类型', trigger: 'change' },
  ],
  specialDetermination: [
    { required: true, message: '请选择特殊判定', trigger: 'change' },
  ],
};

const accidentTypeOptions = ['骑手人伤', '三者人伤', '三者物损', '三者车损'];

const liabilityOptions = [
  '责任待确定',
  '全责',
  '主责',
  '同责',
  '次责',
  '无责',
  '单方事故',
];

const violationTypeOptions = [
  '未确认',
  '闯红灯',
  '逆行',
  '超速行驶',
  '行驶中接打电话或操作手机',
  '占用机动车道行驶',
  '未佩戴安全头盔',
  '随意变道或违法占道',
  '其他',
];

const specialDeterminationOptions = [
  '无',
  '骑手骨折',
  '三者骨折',
  '骑手死亡',
  '三者死亡',
];

const [Modal, modalApi] = useVbenModal({
  title: '定损表详情-出险判定表',
  fullscreen: false,
  class: 'w-[600px]',
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    if (!formRef.value) return;
    await formRef.value.validate((valid: boolean) => {
      if (valid) {
        ElMessage.success('提交成功');
        modalApi.close();
      }
    });
  },
});
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="auto">
        <ElFormItem label="出险类型" prop="accidentType">
          <ElSelect
            v-model="form.accidentType"
            multiple
            placeholder="请选择出险类型"
            class="w-full"
          >
            <ElOption
              v-for="item in accidentTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="事故责任判定" prop="liability">
          <ElSelect
            v-model="form.liability"
            placeholder="请选择事故责任判定"
            class="w-full"
          >
            <ElOption
              v-for="item in liabilityOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="事故违章类型" prop="violationType">
          <ElSelect
            v-model="form.violationType"
            multiple
            placeholder="请选择事故违章类型"
            class="w-full"
          >
            <ElOption
              v-for="item in violationTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="特殊判定" prop="specialDetermination">
          <ElSelect
            v-model="form.specialDetermination"
            multiple
            placeholder="请选择特殊判定"
            class="w-full"
          >
            <ElOption
              v-for="item in specialDeterminationOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="判定备注" prop="remarks">
          <ElInput
            v-model="form.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入判定备注"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </Modal>
</template>
