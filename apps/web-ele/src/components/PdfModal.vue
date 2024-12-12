<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import VueOfficePdf from '@vue-office/pdf';

interface Props {
  previewPdfUrl: string;
}

const props = defineProps<Props>();

const [PdfModal, pdfModalApi] = useVbenModal({
  onCancel() {
    pdfModalApi.close();
  },
  draggable: true,
  showConfirmButton: false,
  cancelText: '关闭',
});

const renderedHandler = () => {};
const errorHandler = () => {
  console.error('渲染失败');
};
</script>
<template>
  <PdfModal class="w-[80%]" title="文件预览">
    <VueOfficePdf
      :src="props.previewPdfUrl"
      @error="errorHandler"
      @rendered="renderedHandler"
    />
  </PdfModal>
</template>

<style scoped>
:deep(.el-upload-list__item .el-icon--close) {
  display: none;
}
</style>
