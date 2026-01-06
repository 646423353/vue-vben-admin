<script lang="ts" setup>
import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AntdPlusOutlined } from '@vben/icons';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

// Define Props
interface Props {
  fileList?: Array<{ label: string; value: number | string }>;
}

defineProps<Props>();

// Form State
const form = reactive({
  assessmentBasis: [''] as string[],
  calculationFormula: '',
  remarks: [''] as string[],
  linkedFiles: [] as string[],
});

// Modal Setup
const [Modal, modalApi] = useVbenModal({
  title: '损失价值计算表-详细测算',
  class: 'w-[800px]',
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    // In a real app, validation and data saving would happen here
    // For now, we just log and close, mimicking a successful save to the parent or backend

    ElMessage.success('详细测算保存成功');
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      // potentially load existing details for this row here
      if (data?.detailData) {
        form.assessmentBasis = data.detailData.assessmentBasis || [''];
        form.calculationFormula = data.detailData.calculationFormula || '';
        form.remarks = data.detailData.remarks || [''];
        form.linkedFiles = data.detailData.linkedFiles || [];
      } else {
        // Reset
        form.assessmentBasis = [''];
        form.calculationFormula = '';
        form.remarks = [''];
        form.linkedFiles = [];
      }
    }
  },
});

// Item Management Logic
const addBasis = () => form.assessmentBasis.push('');
const removeBasis = (index: number) => form.assessmentBasis.splice(index, 1);

const addRemark = () => form.remarks.push('');
const removeRemark = (index: number) => form.remarks.splice(index, 1);

const addFile = () => form.linkedFiles.push('');
const removeFile = (index: number) => form.linkedFiles.splice(index, 1);
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm label-position="top">
        <!-- 1. Assessment Basis -->
        <div class="mb-6">
          <div class="mb-2 flex items-center justify-between">
            <label class="el-form-item__label">定损依据 (可以添加多条)</label>
            <ElButton
              type="primary"
              link
              :icon="AntdPlusOutlined"
              @click="addBasis"
            >
              添加
            </ElButton>
          </div>
          <div
            v-for="(_item, index) in form.assessmentBasis"
            :key="`basis-${index}`"
            class="mb-2 flex gap-2"
          >
            <ElInput
              v-model="form.assessmentBasis[index]"
              type="textarea"
              :rows="2"
              placeholder="请输入定损依据"
            />
            <ElButton
              v-if="form.assessmentBasis.length > 1"
              type="danger"
              link
              @click="removeBasis(index)"
            >
              删除
            </ElButton>
          </div>
        </div>

        <!-- 2. Calculation Formula -->
        <div class="mb-6">
          <ElFormItem label="详细计算公式 (1条)">
            <ElInput
              v-model="form.calculationFormula"
              type="textarea"
              :rows="4"
              placeholder="请输入详细计算公式"
            />
          </ElFormItem>
        </div>

        <!-- 3. Remarks -->
        <div class="mb-6">
          <div class="mb-2 flex items-center justify-between">
            <label class="el-form-item__label">定损备注 (可添加多条)</label>
            <ElButton
              type="primary"
              link
              :icon="AntdPlusOutlined"
              @click="addRemark"
            >
              添加
            </ElButton>
          </div>
          <div
            v-for="(_item, index) in form.remarks"
            :key="`remark-${index}`"
            class="mb-2 flex gap-2"
          >
            <ElInput
              v-model="form.remarks[index]"
              type="textarea"
              :rows="2"
              placeholder="请输入定损备注"
            />
            <ElButton
              v-if="form.remarks.length > 1"
              type="danger"
              link
              @click="removeRemark(index)"
            >
              删除
            </ElButton>
          </div>
        </div>

        <!-- 4. Linked Files -->
        <div class="mb-6">
          <div class="mb-2 flex items-center justify-between">
            <label class="el-form-item__label"
              >关联图片文件资料 (可添加多个关联)</label
            >
            <ElButton
              type="primary"
              link
              :icon="AntdPlusOutlined"
              @click="addFile"
            >
              添加
            </ElButton>
          </div>
          <div
            v-for="(_item, index) in form.linkedFiles"
            :key="`file-${index}`"
            class="mb-2 flex gap-2"
          >
            <ElSelect
              v-model="form.linkedFiles[index]"
              placeholder="选择已经上传的基本资料图像资料中的一个-编号、标签"
              class="w-full"
            >
              <ElOption
                v-for="opt in fileList"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElButton type="danger" link @click="removeFile(index)">
              删除
            </ElButton>
          </div>
          <div
            v-if="form.linkedFiles.length === 0"
            class="text-sm italic text-gray-400"
          >
            暂无关联文件，点击右上角添加
          </div>
        </div>
      </ElForm>
    </div>
  </Modal>
</template>
