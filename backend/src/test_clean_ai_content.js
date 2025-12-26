// 测试增强版AI占位符清理功能
const testCases = [
    {
        input: '这是一个职位描述 {""} 包含占位符',
        expected: '这是一个职位描述 包含占位符',
        description: '测试 {""} 占位符清理'
    },
    {
        input: '职位要求: {} 良好的沟通能力',
        expected: '职位要求: 良好的沟通能力',
        description: '测试 {} 占位符清理'
    },
    {
        input: '岗位职责: **负责项目开发**',
        expected: '岗位职责: 负责项目开发',
        description: '测试 Markdown 粗体符号清理'
    },
    {
        input: '要求: ""  本科学历  ""',
        expected: '要求: 本科学历',
        description: '测试 "" 占位符和多余空格清理'
    },
    {
        input: '职位描述 {""}  包含多个  空格  和占位符 {}',
        expected: '职位描述 包含多个 空格 和占位符',
        description: '测试组合清理'
    },
    {
        input: '【重要】《公司名称》提供优厚待遇',
        expected: '重要 公司名称 提供优厚待遇',
        description: '测试中文特殊符号清理'
    },
    {
        input: '职位描述：\n- 负责前端开发\n- 参与项目设计\n\n\n任职要求：\n- 本科学历',
        expected: '职位描述: \n- 负责前端开发\n- 参与项目设计\n\n任职要求: \n- 本科学历',
        description: '测试换行优化'
    },
    {
        input: '岗位职责：负责开发- 参与设计- 代码审查',
        expected: '岗位职责: 负责开发\n- 参与设计\n- 代码审查',
        description: '测试列表格式优化'
    },
    {
        input: '薪资：15-25K，，，福利：五险一金！！！',
        expected: '薪资: 15-25K, 福利: 五险一金!',
        description: '测试重复标点符号清理'
    },
    {
        input: '使用`React`和`Vue`框架~~已废弃~~',
        expected: '使用React和Vue框架已废弃',
        description: '测试 Markdown 代码和删除线清理'
    },
    {
        input: '工作地点："北京"、\'上海\'、``深圳``',
        expected: '工作地点: "北京"、\'上海\'、深圳',
        description: '测试引号统一'
    },
    {
        input: '公司简介…………优秀团队———创新文化',
        expected: '公司简介...优秀团队-创新文化',
        description: '测试省略号和破折号统一'
    }
];

/**
 * 清理AI生成内容中的占位符号和优化排版
 */
function cleanAIGeneratedContent(text) {
    if (!text || typeof text !== 'string') return text;

    // 1. 基础清理：各种JSON/代码占位符和Markdown符号
    let cleaned = text
        .replace(/\{\s*""\s*\}/g, '')
        .replace(/\{\s*\}/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/\s*""\s*/g, ' ')
        .replace(/\s*''\s*/g, ' ')
        .replace(/\s*``\s*/g, ' ')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/`([^`]+)`/g, '$1');

    // 2. 统一排版规范
    cleaned = cleaned
        .replace(/\r\n/g, '\n')      // 统一换行符
        .replace(/[【】]/g, ' ')      // 这里的方括号通常是AI加的标题包裹，转为空格
        .replace(/[《》]/g, ' ')
        .replace(/：/g, ':');         // 统一冒号

    // 3. 增强标题换行与排版 (在标题前确保有空行)
    const sections = ['职位描述', '岗位职责', '任职要求', '工作职责', '职责描述', '加分项', '福利待遇', '公司福利', '岗位要求', '任职资格'];
    sections.forEach(section => {
        const regex = new RegExp(`([^\\n])\\s*${section}\\s*:`, 'g');
        cleaned = cleaned.replace(regex, `\n\n${section}:`);
    });

    // 4. 逐行处理：处理列表项格式和行首尾缩进
    cleaned = cleaned
        .split('\n')
        .map(line => {
            let l = line.trim();
            // 识别列表符号：如果是以 - • · • 开头，标准化为 "- "
            if (/^[-•·]\s*/.test(l)) {
                return l.replace(/^[-•·]\s*/, '- ');
            }
            return l;
        })
        .join('\n');

    // 5. 细节优化：清理多余空行、空格和重复标点
    return cleaned
        .replace(/\n{3,}/g, '\n\n')        // 最多保留两行换行（一个空行）
        .replace(/ {2,}/g, ' ')            // 移除多余空格
        .replace(/:\s*/g, ': ')            // 确保冒号后有一个空格
        .replace(/([。！？,.!?])\1+/g, '$1')  // 移除连续重复标点
        .replace(/\s*(\.\.\.|…+)\s*/g, '...') // 统一省略号
        .replace(/\s*(—+|-{2,})\s*/g, '-')   // 统一长划线
        .trim();
}

console.log('开始测试增强版AI占位符清理功能...\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
    const result = cleanAIGeneratedContent(testCase.input);
    const passed = result === testCase.expected;

    console.log(`\n测试 ${index + 1}: ${testCase.description}`);
    console.log('-'.repeat(80));

    if (passed) {
        passedTests++;
        console.log('✅ 通过');
    } else {
        failedTests++;
        console.log('❌ 失败');
        console.log(`输入:  "${testCase.input}"`);
        console.log(`期望:  "${testCase.expected}"`);
        console.log(`实际:  "${result}"`);
    }
});

console.log('\n' + '='.repeat(80));
console.log(`\n测试完成!`);
console.log(`✅ 通过: ${passedTests}/${testCases.length}`);
console.log(`❌ 失败: ${failedTests}/${testCases.length}`);
console.log(`📊 成功率: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

if (failedTests === 0) {
    console.log('\n🎉 所有测试通过!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${failedTests} 个测试失败,请检查清理函数`);
    process.exit(1);
}
