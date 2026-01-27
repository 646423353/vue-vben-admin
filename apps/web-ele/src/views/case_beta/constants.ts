export const AccidentTypeOptions = [
  { label: '骑手人伤', value: '1' },
  { label: '三者人伤', value: '2' },
  { label: '三者物损', value: '3' },
  { label: '三者车损', value: '4' },
];

export const LiabilityOptions = [
  { label: '责任待确定', value: '1' },
  { label: '全责', value: '2' },
  { label: '主责', value: '3' },
  { label: '同责', value: '4' },
  { label: '次责', value: '5' },
  { label: '无责', value: '6' },
  { label: '单方事故', value: '7' },
];

export const ViolationOptions = [
  { label: '未确认', value: '1' },
  { label: '闯红灯', value: '2' },
  { label: '逆行', value: '3' },
  { label: '超速行驶', value: '4' },
  { label: '行驶中接打电话或操作手机', value: '5' },
  { label: '占用机动车道行驶', value: '6' },
  { label: '未佩戴安全头盔', value: '7' },
  { label: '随意变道或违法占道', value: '8' },
  { label: '其他', value: '9' },
];

export const SpecialDeterminationOptions = [
  { label: '无', value: '1' },
  { label: '骑手骨折', value: '2' },
  { label: '三者骨折', value: '3' },
  { label: '骑手死亡', value: '4' },
  { label: '三者死亡', value: '5' },
];

export function getLabelFromValue(
  value: string | undefined,
  options: { label: string; value: string }[],
): string {
  if (!value) return '';
  const found = options.find((opt) => opt.value === value);
  return found ? found.label : value;
}

export function getLabelsFromValues(
  values: string | undefined,
  options: { label: string; value: string }[],
): string {
  if (!values) return '';
  const valueArr = values.split(',');
  return valueArr
    .map((v) => {
      const found = options.find((opt) => opt.value === v);
      return found ? found.label : v;
    })
    .join('，'); // Use Chinese comma for display
}
