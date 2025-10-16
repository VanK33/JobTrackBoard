# 测试Consolidation功能

## 问题诊断

从图片可以看到Progress Dates有5条记录（Applied → Screening → Interview → Offered → Applied），这说明：

**✅ Consolidation window正在工作** - 所有状态都被记录到同一个consolidation window
**⏳ Window还未过期** - 2分钟还未到，所以还没有触发consolidation

## 如何触发Consolidation

Consolidation是**lazy触发**的，有两种方式：

### 方法1: 等待2分钟 + 再次修改状态

1. **等待2分钟**（从第一次修改状态开始计时）
2. **再修改一次status**（改成任何状态都可以）
3. 这时API会调用`checkAndConsolidateExpiredWindow()`自动consolidate
4. **查看Progress Dates** - 应该只剩2条：Applied (first) 和最后的状态

### 方法2: 浏览器Console手动触发

如果你想立即测试，可以在浏览器Console运行：

```javascript
// 获取job ID（从URL或者当前展开的job卡片）
const jobId = 123; // 替换成实际的job ID

// 获取database config
const dbConfig = localStorage.getItem('databaseConfig');

// 手动触发consolidation检查
fetch(`http://localhost:3000/api/jobs/${jobId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'x-database-config': dbConfig
  },
  body: JSON.stringify({ status: 'applied' }) // 任意状态
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  // 刷新页面查看Progress Dates
  window.location.reload();
});
```

## 预期结果

### 当前情况（图片显示）
```
Applied → Screening → Interview → Offered → Applied
```
5条记录都显示

### Consolidation后（使用我们的修复）
应该只剩**2条**记录：
```
1. Applied (最早的，timestamp: 原始时间)
2. Applied (最后的，timestamp: 最新时间)
```

**但是！** 因为这是rollback scenario（first === last都是Applied），实际上应该**合并成1条**：
```
1. Applied (timestamp: 原始时间)
```

所有中间的Screening、Interview、Offered都会被删除。

## 如果Consolidation没有触发

检查以下几点：

### 1. 检查Window状态

在浏览器Console运行：
```javascript
const jobId = 123; // 替换成实际ID
const dbConfig = localStorage.getItem('databaseConfig');

fetch(`http://localhost:3000/api/jobs/${jobId}/consolidation-status`, {
  headers: {
    'x-database-config': dbConfig
  }
})
.then(r => r.json())
.then(data => console.log('Consolidation Window:', data));
```

应该看到：
```json
{
  "consolidationWindow": {
    "id": 1,
    "jobId": 123,
    "windowStartTime": 1729000000000,
    "windowEndTime": 1729000120000,  // start + 2分钟
    "firstStatus": "applied",
    "isActive": true,
    "remainingMs": 45000  // 剩余毫秒数
  }
}
```

### 2. 确认2分钟已过期

如果`remainingMs > 0`，说明window还未过期，需要继续等待。

### 3. 检查后端日志

查看terminal中的后端日志，应该看到：
```
Consolidation window expired for job 123, consolidating...
Consolidation: Rollback detected for job 123 { windowId: 1, status: 'applied', kept: 1, deleted: 4 }
Stage timestamp nullified for job 123: screening (screening_at)
Stage timestamp nullified for job 123: interview (interview_at)
Stage timestamp nullified for job 123: offered (offered_at)
Consolidation complete for job 123: deleted 4 entries, kept 1 entries
```

## 测试步骤（完整流程）

### 测试Rollback Scenario（你当前的情况）

1. ✅ **已完成**: Applied → Screening → Interview → Offered → Applied（在2分钟内）
2. ⏳ **等待**: 等待2分钟（从第一次修改开始计时）
3. 🔄 **触发**: 再修改一次status（任意status）或刷新页面
4. ✅ **验证**: Progress Dates应该只显示**1条** Applied记录（使用原始timestamp）

### 测试Normal Scenario（不同的first和last）

1. 创建新job或使用另一个job
2. 修改状态: Applied → Screening → Interview → Offered（在2分钟内）
3. 等待2分钟
4. 再修改一次status触发consolidation
5. 验证: Progress Dates应该只显示**2条**:
   - Applied (first)
   - Offered (last)
   - Screening和Interview被删除

## 调试工具

### 查看数据库中的原始数据

**PostgreSQL**:
```sql
-- 查看job_status_history
SELECT id, job_id, status, changed_at, consolidation_window_id
FROM job_status_history
WHERE job_id = 123
ORDER BY changed_at;

-- 查看consolidation_windows
SELECT * FROM consolidation_windows WHERE job_id = 123;

-- 查看stage_timestamps
SELECT * FROM job_stage_timestamps WHERE job_id = 123;
```

**SQLite**:
在代码中添加log或使用SQLite browser工具查看`job_tracker.sqlite`文件。

## 预期的数据库状态

### Consolidation之前
```
job_status_history:
  id=1  status=applied     window_id=1
  id=2  status=screening   window_id=1
  id=3  status=interview   window_id=1
  id=4  status=offered     window_id=1
  id=5  status=applied     window_id=1

consolidation_windows:
  id=1  is_active=true
```

### Consolidation之后（Rollback scenario）
```
job_status_history:
  id=1  status=applied     window_id=1  ← 只保留第一条

consolidation_windows:
  id=1  is_active=false  ← 标记为inactive

job_stage_timestamps:
  applied_at=2025-10-15T...     ← 保留
  screening_at=NULL            ← 被nullify
  interview_at=NULL            ← 被nullify
  offered_at=NULL              ← 被nullify
```

## 总结

你的测试是**正确的**！只是需要：

1. **等待2分钟**（或者查看`remainingMs`确认已过期）
2. **再修改一次status**来触发consolidation
3. **刷新页面**查看结果

Consolidation**不会自动在前端显示**，需要重新获取数据或刷新页面。
