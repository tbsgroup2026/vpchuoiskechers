/**
 * Chuyển đổi số tiền VND sang chữ Tiếng Việt
 */

const defaultUnits = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readGroupOfThree(num: number): string {
  const hundred = Math.floor(num / 100);
  const ten = Math.floor((num % 100) / 10);
  const unit = num % 10;
  let result = "";

  if (hundred > 0 || ten > 0 || unit > 0) {
    if (hundred > 0) {
      result += defaultUnits[hundred] + " trăm ";
    }
    if (ten > 1) {
      result += defaultUnits[ten] + " mươi ";
      if (unit === 1) result += "mốt";
      else if (unit === 5) result += "lăm";
      else if (unit > 0) result += defaultUnits[unit];
    } else if (ten === 1) {
      result += "mười ";
      if (unit === 5) result += "lăm";
      else if (unit > 0) result += defaultUnits[unit];
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0) result += "lẻ ";
      result += defaultUnits[unit];
    }
  }

  return result.trim();
}

export function numberToWordsVn(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Không đồng";
  if (amount < 0) return "Âm " + numberToWordsVn(Math.abs(amount));

  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let numStr = Math.round(amount).toString();
  let groups: number[] = [];

  while (numStr.length > 0) {
    const chunk = numStr.slice(-3);
    numStr = numStr.slice(0, -3);
    groups.push(parseInt(chunk, 10));
  }

  let parts: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g > 0) {
      const gWords = readGroupOfThree(g);
      const scale = scales[i] ? " " + scales[i] : "";
      parts.unshift(gWords + scale);
    }
  }

  const resultStr = parts.join(" ").trim();
  if (!resultStr) return "Không đồng";

  return resultStr.charAt(0).toUpperCase() + resultStr.slice(1) + " đồng";
}

export function numberToWords(amount: number): string {
  return numberToWordsVn(amount);
}

export function convertNumberToWords(amount: number): string {
  return numberToWordsVn(amount);
}

export default numberToWordsVn;

