/**
 * 根据出生日期计算宝宝月龄/年龄
 * @param {string} birthStr - 出生日期 YYYY-MM-DD
 * @returns {string} - 如 "3个月15天" / "1岁2个月" / "未出生" / "未知"
 */
export function calculateAge(birthStr) {
  if (!birthStr) return "未知";
  const birth = new Date(birthStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return "未知";
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    days += 30;
  }
  if (months < 0) return "未出生";
  if (months < 12) return `${months}个月${days}天`;
  return `${Math.floor(months / 12)}岁${months % 12}个月`;
}
