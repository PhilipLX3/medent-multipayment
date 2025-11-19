/**
 * 金額をフォーマットする共通関数
 * @param amount 金額（数値または文字列）
 * @returns フォーマットされた金額文字列
 */
export const formatAmount = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) {
    return '0';
  }
  
  // 文字列の場合、数値に変換
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  // 3桁ごとにカンマを挿入
  return numAmount.toLocaleString('ja-JP');
};

/**
 * 入力フィールド用の金額フォーマット（先頭の0を削除）
 * @param value 入力値
 * @returns フォーマットされた値
 */
export const formatAmountInput = (value: string): string => {
  // 数字以外を削除
  const numericValue = value.replace(/[^\d]/g, '');
  
  // 先頭の0を削除（ただし、値が"0"の場合は残す）
  const withoutLeadingZeros = numericValue.replace(/^0+(?=\d)/, '');
  
  // 空の場合は空文字を返す
  if (!withoutLeadingZeros) {
    return '';
  }
  
  // 数値に変換してフォーマット
  const numValue = parseInt(withoutLeadingZeros, 10);
  return numValue.toLocaleString('ja-JP');
};

/**
 * フォーマットされた金額を数値に変換
 * @param formattedValue フォーマットされた金額文字列
 * @returns 数値
 */
export const parseFormattedAmount = (formattedValue: string): number => {
  const numericValue = formattedValue.replace(/[^\d]/g, '');
  return parseInt(numericValue, 10) || 0;
};