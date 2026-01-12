// --- Shared Helpers ---

export const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => Array.isArray(val) ? `"${val.join('; ')}"` : `"${val}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

/**
 * 计算简历完整度
 * @param user 用户对象
 * @returns 0-100 的整数
 */
export const calculateResumeCompleteness = (user: any): number => {
    let score = 0;

    // 1. 头像 (10%)
    if (user.avatar) score += 10;

    // 2. 基本资料 (15%)
    if (user.name) score += 5;
    if (user.gender && user.gender !== '未设置') score += 5;
    if (user.birthDate || user.birth_date) score += 5;

    // 3. 联系方式 (10%)
    if (user.phone) score += 5;
    if (user.email) score += 5;

    // 4. 教育背景 (15%)
    if (user.education && user.education !== '未设置') score += 5;
    if (user.school && user.school !== '未设置') score += 5;
    if (user.major && user.major !== '未设置') score += 5;

    // 5. 工作经验 (10%)
    if (user.workExperienceYears !== undefined && user.workExperienceYears !== null) score += 10;

    // 6. 职业能力 (20%)
    if (user.skills && user.skills.length > 0) score += 10;
    if (user.desiredPosition || user.desired_position) score += 10;

    // 7. 附加信息 (20%)
    if (user.languages && user.languages.length > 0) score += 5;
    // 社交/地址 (每个3分，最高15分)
    const extras = ['address', 'wechat', 'linkedin', 'github', 'personalWebsite'];
    let extrasScore = 0;
    extras.forEach(key => {
        if (user[key] && user[key] !== '未设置') extrasScore += 3;
    });
    score += Math.min(15, extrasScore);

    return Math.min(100, Math.round(score));
};