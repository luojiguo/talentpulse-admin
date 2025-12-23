### 问题分析

在MessageCenterScreen组件中，联系人列表是通过`mergedConversations`函数渲染的，该函数通过`conversations`数据按招聘者ID分组合并得到联系人列表。

**关键问题**：第183行代码使用`conv.recruiterUserId`来获取招聘者ID，但如果后端返回的字段名不是`recruiterUserId`（比如`recruiter_id`、`recruiterId`等），那么`recruiterId`就会是`undefined`，导致整个对话被跳过，无法添加到联系人列表中。

### 修复方案

修改`mergedConversations`函数中的分组逻辑，支持多种可能的招聘者ID字段名，包括：
- recruiterUserId
- recruiter_id
- recruiterId
- RecruiterId

### 修复代码

在`MessageCenterScreen.tsx`文件中，修改第183行的分组逻辑：

```typescript
// 原代码
const recruiterId = conv.recruiterUserId;
if (!recruiterId) return;

// 修改后代码
const recruiterId = conv.recruiterUserId || conv.recruiter_id || conv.recruiterId || conv.RecruiterId;
if (!recruiterId) return;
```

### 预期效果

修复后，无论后端返回哪种招聘者ID字段名，对话都能正确分组，联系人列表能正常显示。