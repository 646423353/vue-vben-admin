<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  DingsunMoneyAddApi,
  DingsunMoneyGetApi,
  DingsunMoneyUpdateApi,
} from '#/api/core/case-money';
import { useCaseStore } from '#/store/case';

import {
  AccidentTypeOptions,
  LiabilityOptions,
  ViolationOptions,
} from '../constants';

interface Subject {
  label: string;
  key: string;
}

const emit = defineEmits(['switchToValueAssessment']);
const formRef = ref();
const ArrowRight = createIconifyIcon('ep:arrow-right');
const caseId = ref<number | string>('');
const originalData = ref<any>({});
const subjects = ref<Subject[]>([]);
const submitting = ref(false);
const readonly = ref(false);

const form = reactive({
  accidentType: [] as string[],
  liability: {} as Record<string, string>, // Changed to object for dynamic keys
  violationType: [] as string[],
  specialDetermination: [] as string[],
  remarks: '',
});

const rules = {
  accidentType: [
    { required: true, message: '请选择出险类型', trigger: 'change' },
  ],
  // liability validation is handled dynamically or custom validator
  violationType: [
    { required: true, message: '请选择事故违章类型', trigger: 'change' },
  ],
  specialDetermination: [
    { required: true, message: '请选择特殊判定', trigger: 'change' },
  ],
};

const caseStore = useCaseStore();

const [Modal, modalApi] = useVbenModal({
  title: '定损表详情-出险判定表',
  fullscreen: false,
  class: 'w-[600px]',
  onCancel() {
    modalApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      caseStore.fetchSpecialJudgmentList();
      const data = modalApi.getData<Record<string, any>>();
      if (data.caseId) {
        caseId.value = data.caseId;
        readonly.value = data.isReadonly || false;

        modalApi.setState({ showConfirmButton: !readonly.value });

        // Build subjects list
        const subjectList: Subject[] = [{ label: '骑手', key: 'rider' }];
        if (data.subjects && Array.isArray(data.subjects)) {
          data.subjects
            .filter((item: any) => item.zt !== '骑手')
            .forEach((_: any, index: number) => {
              subjectList.push({
                label: `三者${index + 1}`,
                key: `tp_${index}`,
              });
            });
        }
        subjects.value = subjectList;

        fetchData(data.caseId);
      }
    } else {
      // Reset form on close
      form.accidentType = [];
      form.liability = {};
      form.violationType = [];
      form.specialDetermination = [];
      form.remarks = '';
      originalData.value = {};
      subjects.value = [];
      readonly.value = false;
    }
  },
});

const fetchData = async (id: number | string) => {
  try {
    modalApi.setState({ loading: true });
    const res = await DingsunMoneyGetApi(id);
    if (res) {
      originalData.value = res;
      form.accidentType = res.types ? res.types.split(',') : [];

      // Parse zeren
      try {
        form.liability =
          res.zeren && res.zeren.startsWith('{')
            ? JSON.parse(res.zeren)
            : res.zeren
              ? { rider: res.zeren }
              : {};
      } catch (error) {
        console.warn('Failed to parse zeren JSON', error);
        form.liability = {};
      }

      form.violationType = res.weizhang ? res.weizhang.split(',') : [];
      form.specialDetermination = res.panding ? res.panding.split(',') : [];
      form.remarks = res.remark || '';
    }
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.setState({ loading: false });
  }
};

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      // Validate liability manually since it's dynamic
      const allSubjectsSelected = subjects.value.every(
        (sub) => form.liability[sub.key],
      );
      if (!allSubjectsSelected) {
        ElMessage.warning('请为所有主体选择事故责任判定');
        return;
      }

      try {
        submitting.value = true;
        // Construct details object
        const details = {
          ...originalData.value,
          caseId: caseId.value,
          types: form.accidentType.join(','),
          zeren: JSON.stringify(form.liability), // Serialize to JSON
          weizhang: form.violationType.join(','),
          panding: form.specialDetermination.join(','),
          remark: form.remarks,
        };

        // Construct MoneyDto
        const payload = {
          id: caseId.value,
          details,
          items: originalData.value.items || [],
        };

        originalData.value && originalData.value.id
          ? await DingsunMoneyUpdateApi(payload)
          : await DingsunMoneyAddApi(payload);
        ElMessage.success('提交成功');
        const data = modalApi.getData<Record<string, any>>();
        if (data.onSuccess) {
          data.onSuccess();
        }
        modalApi.close();
      } catch (error) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
}

function handleSwitchToValueAssessment() {
  modalApi.close();
  emit('switchToValueAssessment');
}
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="auto">
        <ElFormItem label="出险类型" prop="accidentType">
          <ElSelect
            v-model="form.accidentType"
            :disabled="readonly"
            multiple
            placeholder="请选择出险类型"
            class="w-full"
          >
            <ElOption
              v-for="item in AccidentTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <!-- Dynamic Liability Inputs -->
        <ElFormItem label="事故责任判定" required class="!mb-0">
          <!-- Using a wrapper for layout -->
          <div class="w-full flex-col">
            <template v-for="sub in subjects" :key="sub.key">
              <div class="mb-4 flex items-center">
                <span
                  class="mr-3 w-16 shrink-0 text-right text-sm text-gray-600 dark:text-gray-400"
                  >{{ sub.label }}:</span
                >
                <ElSelect
                  v-model="form.liability[sub.key]"
                  :disabled="readonly"
                  placeholder="请选择"
                  class="flex-1"
                >
                  <ElOption
                    v-for="item in LiabilityOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </div>
            </template>
          </div>
        </ElFormItem>

        <ElFormItem label="事故违章类型" prop="violationType">
          <ElSelect
            v-model="form.violationType"
            :disabled="readonly"
            multiple
            placeholder="请选择事故违章类型"
            class="w-full"
          >
            <ElOption
              v-for="item in ViolationOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="特殊判定" prop="specialDetermination">
          <ElSelect
            v-model="form.specialDetermination"
            :disabled="readonly"
            multiple
            placeholder="请选择特殊判定"
            class="w-full"
          >
            <ElOption
              v-for="item in caseStore.specialJudgmentList"
              :key="item.id"
              :label="item.title"
              :value="String(item.id)"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="判定备注" prop="remarks">
          <ElInput
            v-model="form.remarks"
            :disabled="readonly"
            type="textarea"
            :rows="3"
            placeholder="请输入判定备注"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton
          v-if="originalData.id && !readonly"
          class="group"
          @click="handleSwitchToValueAssessment"
        >
          修改损失价值计算表
          <ElIcon class="ml-1 transition-transform group-hover:translate-x-1">
            <ArrowRight />
          </ElIcon>
        </ElButton>
        <ElButton @click="modalApi.close()">取消</ElButton>
        <ElButton
          v-if="!readonly"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确认
        </ElButton>
      </div>
    </template>
  </Modal>
</template>
