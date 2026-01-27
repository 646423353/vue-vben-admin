<script lang="ts" setup>
import { reactive, ref } from 'vue';

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
  // Removes fileList from props as it is passed via setData
}

defineProps<Props>();

// Form State
const form = reactive({
  csYiju: '',
  gongshi: '',
  comments: '',
  pics: [] as string[],
});

const fileList = ref<Array<{ label: string; value: number | string }>>([]);
const readonly = ref(false);

// Modal Setup
const [Modal, modalApi] = useVbenModal({
  title: '损失价值计算表-详细测算',
  class: 'w-[800px]',
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    // Validate and prepare data
    const result = {
      csYiju: form.csYiju,
      gongshi: form.gongshi,
      comments: form.comments,
      pics: form.pics.join(','),
      detailData: {
        csYiju: form.csYiju,
        gongshi: form.gongshi,
        comments: form.comments,
        pics: form.pics,
      },
    };

    const data = modalApi.getData<Record<string, any>>();
    if (data?.onSuccess) {
      data.onSuccess(result);
    }

    ElMessage.success('详细测算保存成功');
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      fileList.value = data.fileList || [];
      readonly.value = data.isReadonly || false;

      modalApi.setState({ showConfirmButton: !readonly.value });

      if (data?.detailData) {
        form.csYiju = Array.isArray(data.detailData.csYiju)
          ? data.detailData.csYiju.join('\n')
          : data.detailData.csYiju || '';

        form.gongshi = data.detailData.gongshi || '';
        form.comments = data.detailData.comments || '';
        form.pics = data.detailData.pics || [];
      } else {
        form.csYiju = '';
        form.gongshi = '';
        form.comments = '';
        form.pics = [];
      }
    } else {
      readonly.value = false;
    }
  },
});

// Item Management Logic
// Item Management Logic
// Item Management Logic
const addFile = () => form.pics.push('');
const removeFile = (index: number) => form.pics.splice(index, 1);
</script>

<template>
  <Modal>
    <div class="p-6">
      <ElForm label-position="top">
        <!-- 1. Assessment Basis -->
        <!-- 1. Assessment Basis -->
        <div class="mb-6">
          <ElFormItem label="定损依据">
            <ElInput
              v-model="form.csYiju"
              :disabled="readonly"
              type="textarea"
              :rows="4"
              placeholder="请输入定损依据"
            />
          </ElFormItem>
        </div>

        <!-- 2. Calculation Formula -->
        <div class="mb-6">
          <ElFormItem label="详细计算公式">
            <ElInput
              v-model="form.gongshi"
              :disabled="readonly"
              type="textarea"
              :rows="4"
              placeholder="请输入详细计算公式"
            />
          </ElFormItem>
        </div>

        <!-- 3. Remarks -->
        <!-- 3. Remarks -->
        <div class="mb-6">
          <ElFormItem label="定损备注">
            <ElInput
              v-model="form.comments"
              :disabled="readonly"
              type="textarea"
              :rows="4"
              placeholder="请输入定损备注"
            />
          </ElFormItem>
        </div>

        <!-- 4. Linked Files -->
        <div class="mb-6">
          <div class="mb-2 flex items-center justify-between">
            <label class="el-form-item__label"
              >关联图片文件资料 (可添加多个关联)</label
            >
            <ElButton
              v-if="!readonly"
              type="primary"
              link
              :icon="AntdPlusOutlined"
              @click="addFile"
            >
              添加
            </ElButton>
          </div>
          <div
            v-for="(_item, index) in form.pics"
            :key="`file-${index}`"
            class="mb-2 flex gap-2"
          >
            <ElSelect
              v-model="form.pics[index]"
              :disabled="readonly"
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
            <ElButton
              v-if="!readonly"
              type="danger"
              link
              @click="removeFile(index)"
            >
              删除
            </ElButton>
          </div>
          <div
            v-if="form.pics.length === 0"
            class="text-sm italic text-gray-400"
          >
            暂无关联文件，点击右上角添加
          </div>
        </div>
      </ElForm>
    </div>
  </Modal>
</template>
