/**
 * RichText项的接口定义
 */
interface RichTextItem {
  text: string;
  font?: {
    bold?: boolean;
    color?: {
      argb?: string;
      theme?: number;
    };
    family?: number;
    italic?: boolean;
    name?: string;
    scheme?: string;
    size?: number;
    underline?: boolean;
  };
}

/**
 * Excel单元格值的接口定义
 */
interface CellValue {
  richText?: RichTextItem[];
  text?: {
    richText?: RichTextItem[];
  };
  toString?: () => string;
}

/**
 * 从Excel的richText中提取纯文本
 * @param cellValue - Excel单元格的值
 * @returns 提取的纯文本
 */
export function extractTextFromRichText(
  cellValue: any | CellValue,
): any | string {
  // 如果cellValue为空或不是对象，直接返回原值
  if (!cellValue || typeof cellValue !== 'object') {
    return cellValue ? cellValue?.toString().trim() : cellValue;
  }

  // 处理richText直接在cellValue中的情况
  if (Array.isArray(cellValue.richText)) {
    return cellValue.richText
      .map((item: RichTextItem) => item.text)
      .join('')
      .trim();
  }

  // 处理richText在text属性中的情况
  if (cellValue.text && Array.isArray(cellValue.text.richText)) {
    return cellValue.text.richText
      .map((item: RichTextItem) => item.text)
      .join('')
      .trim();
  }

  // 如果没有找到richText结构，返回原始值
  return cellValue.toString();
}
