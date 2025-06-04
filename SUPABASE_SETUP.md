# Supabase 对话同步功能设置指南（支持多对话）

这个功能允许用户将所有对话记录保存到Supabase数据库中，实现跨设备/浏览器的完整对话历史同步。

## 1. 前置条件

确保你已经：
- 创建了Supabase项目
- 获取了SUPABASE_URL和SUPABASE_ANON_KEY
- 在`.env.local`文件中设置了环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=你的supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase匿名密钥
```

## 2. 数据库设置

在Supabase项目的SQL编辑器中执行`database-schema.sql`文件中的SQL语句：

```sql
-- 执行database-schema.sql中的所有SQL语句
```

这将创建：
- `user_conversations`表（保存所有对话记录）
- `user_current_conversation`表（记录用户最后选中的对话）
- 必要的索引
- 行级安全策略
- 自动更新时间戳的触发器

## 3. 新的数据库结构

### user_conversations 表
保存用户的所有对话记录：
```sql
user_conversations (
  id UUID PRIMARY KEY,
  user_id UUID (外键关联auth.users),
  app_id TEXT,
  conversation_id TEXT,
  conversation_name TEXT,
  conversation_inputs JSONB,
  conversation_introduction TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, app_id, conversation_id)
)
```

### user_current_conversation 表
记录用户最后选中的对话ID：
```sql
user_current_conversation (
  id UUID PRIMARY KEY,
  user_id UUID (外键关联auth.users),
  app_id TEXT,
  current_conversation_id TEXT,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, app_id)
)
```

## 4. 功能特性

### 完整对话历史同步
- **保存所有对话**：用户的每个对话都会保存到数据库
- **记录当前对话**：记住用户最后选中的对话
- **跨设备同步**：在任何设备登录都能看到完整的对话历史

### 自动降级机制
- **用户已登录**：数据保存到Supabase数据库
- **用户未登录**：自动降级到localStorage存储
- **网络错误**：自动回退到localStorage作为备份

### 数据同步策略
- **实时保存**：每次创建/更新对话时自动保存
- **批量同步**：用户首次登录时可以同步本地数据
- **智能合并**：合并本地和远程数据，避免重复

## 5. 新的API函数

### 对话记录管理
```typescript
// 保存单个对话
await saveConversationToSupabase(userId, conversationWithAppId)

// 批量保存多个对话
await saveConversationsToSupabase(userId, appId, conversations)

// 获取所有对话
const conversations = await getConversationsFromSupabase(userId, appId)

// 删除对话
await deleteConversationFromSupabase(userId, appId, conversationId)
```

### 当前对话管理
```typescript
// 保存当前对话ID
await saveCurrentConversationIdToSupabase(userId, appId, conversationId)

// 获取当前对话ID
const currentId = await getCurrentConversationIdFromSupabase(userId, appId)
```

### Hook层面的新功能
```typescript
const {
  // 现有功能
  conversationList,
  setConversationList,
  setCurrConversationId,
  getConversationIdFromStorage,
  
  // 新增功能
  saveConversationListToSupabase,      // 保存对话列表到Supabase
  getConversationListFromSupabase,     // 从Supabase获取对话列表
  saveConversationToStorage,           // 保存单个对话
  syncLocalStorageToSupabase,          // 同步本地数据到Supabase
  mergeConversationLists,              // 合并本地和远程对话列表
} = useConversation()
```

## 6. 使用示例

### 在应用初始化时获取对话列表
```typescript
useEffect(() => {
  const initConversations = async () => {
    // 从Supabase获取对话列表（会自动降级到localStorage）
    const conversations = await getConversationListFromSupabase(APP_ID)
    setConversationList(conversations)
    
    // 获取当前对话ID
    const currentId = await getConversationIdFromStorage(APP_ID)
    if (currentId && conversations.some(conv => conv.id === currentId)) {
      setCurrConversationId(currentId, APP_ID, false)
    }
  }
  
  initConversations()
}, [])
```

### 创建新对话时自动保存
```typescript
const createNewConversation = async (conversationData) => {
  // 更新本地状态
  setConversationList(prev => [conversationData, ...prev])
  
  // 自动保存到Supabase（如果用户已登录）
  await saveConversationToStorage(APP_ID, conversationData)
  
  // 设置为当前对话
  await setCurrConversationId(conversationData.id, APP_ID)
}
```

### 用户登录后同步数据
```typescript
const handleUserLogin = async () => {
  // 同步localStorage数据到Supabase
  await syncLocalStorageToSupabase(APP_ID)
  
  // 获取最新的对话列表
  const remoteConversations = await getConversationListFromSupabase(APP_ID)
  const localConversations = conversationList
  
  // 合并数据
  const mergedConversations = mergeConversationLists(localConversations, remoteConversations)
  setConversationList(mergedConversations)
}
```

## 7. 数据流程图

```
用户操作 → 检查登录状态 → 选择存储方式
    ↓
已登录 → Supabase数据库 → 成功/失败
    ↓           ↓
   成功      失败 → localStorage备份
    
未登录 → localStorage存储
```

## 8. 测试步骤

### 基础功能测试
1. **未登录状态**
   - 创建多个对话，检查localStorage
   - 刷新页面，验证对话列表恢复
   - 切换对话，验证当前对话ID保存

2. **登录状态**
   - 用户登录，创建对话，检查Supabase数据库
   - 在另一个设备/浏览器登录同一账户
   - 验证对话列表和当前对话ID同步

### 数据同步测试
1. **本地到远程同步**
   - 未登录时创建多个对话
   - 用户登录，执行同步操作
   - 检查Supabase数据库中的数据

2. **远程到本地同步**
   - 在设备A创建对话
   - 在设备B登录同一账户
   - 验证对话列表自动同步

### 错误处理测试
1. **网络断开**
   - 断网状态下创建对话
   - 验证自动回退到localStorage
   - 恢复网络后验证数据同步

## 9. 迁移说明

如果你已经在使用旧版本，需要：

1. **备份现有数据**
   ```sql
   -- 备份旧表数据（如果有）
   SELECT * FROM user_conversation_info;
   ```

2. **执行新的数据库脚本**
   - 运行新的`database-schema.sql`
   - 旧表会被自动删除并重建

3. **更新应用代码**
   - 现有的API调用仍然兼容
   - 建议逐步使用新的API函数

## 10. 性能优化建议

1. **分页加载**：如果对话数量很多，考虑分页加载
2. **缓存策略**：在内存中缓存常用对话数据
3. **批量操作**：尽量使用批量保存减少网络请求
4. **索引优化**：根据查询模式添加合适的数据库索引

## 11. 故障排除

### 常见问题

1. **数据重复**
   - 检查UNIQUE约束是否正确设置
   - 使用upsert操作避免重复插入

2. **同步失败**
   - 检查网络连接
   - 验证用户认证状态
   - 查看浏览器控制台错误日志

3. **性能问题**
   - 检查数据库查询计划
   - 优化索引配置
   - 考虑数据分页
