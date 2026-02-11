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
    // Get days in previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) return "未出生";
  if (months === 0) return `${days}天`;
  if (months < 12) return `${months}个月${days}天`;
  return `${Math.floor(months / 12)}岁${months % 12}个月`;
}

/**
 * 根据预产期计算当前孕周
 * @param {string} dueDateStr - 预产期 YYYY-MM-DD
 * @returns {string} - 如 "孕24周+3天"
 */
export function calculatePregnancyWeeks(dueDateStr) {
  if (!dueDateStr) return "未知";
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize today
  due.setHours(0, 0, 0, 0); // Normalize due date

  if (isNaN(due.getTime())) return "未知";

  // Total pregnancy is 40 weeks (280 days)
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = (due - now) / msPerDay;
  
  // Calculate days pregnant: 280 - daysUntilDue
  const daysPregnant = 280 - Math.ceil(daysUntilDue);

  if (daysPregnant < 0) return "备孕中";
  if (daysPregnant > 300) return "已超预产期"; // Just a safeguard

  const weeks = Math.floor(daysPregnant / 7);
  const days = daysPregnant % 7;

  return `孕${weeks}周+${days}天`;
}

/**
 * 获取当前阶段标识
 * @param {Object} profile 
 * @returns {'pregnancy' | 'infant' | 'toddler' | 'all'}
 */
export function getStage(profile) {
  if (profile.status === 'pregnancy') return 'pregnancy';
  
  if (profile.birth) {
    const birth = new Date(profile.birth);
    const now = new Date();
    const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (ageMonths < 0) return 'pregnancy'; // Fallback if status not set but date is future
    if (ageMonths < 12) return 'infant';
    return 'toddler';
  }
  
  return 'all';
}
