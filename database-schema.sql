-- 删除旧表（如果存在）
DROP TABLE IF EXISTS user_conversation_info;

-- 创建用户对话记录表（保存所有对话）
CREATE TABLE IF NOT EXISTS user_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  conversation_name TEXT,
  conversation_inputs JSONB,
  conversation_introduction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id, conversation_id)
);

-- 创建用户当前对话表（记录用户最后选中的对话）
CREATE TABLE IF NOT EXISTS user_current_conversation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  current_conversation_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- 为查询性能创建索引
CREATE INDEX IF NOT EXISTS idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_app_id ON user_conversations(app_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_user_app ON user_conversations(user_id, app_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_conversation_id ON user_conversations(conversation_id);

CREATE INDEX IF NOT EXISTS idx_user_current_conversation_user_id ON user_current_conversation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_current_conversation_app_id ON user_current_conversation(app_id);

-- 设置行级安全性 (RLS)
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_current_conversation ENABLE ROW LEVEL SECURITY;

-- 用户对话记录表的安全策略
CREATE POLICY "Users can view own conversations" ON user_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON user_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON user_conversations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON user_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- 用户当前对话表的安全策略
CREATE POLICY "Users can view own current conversation" ON user_current_conversation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own current conversation" ON user_current_conversation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own current conversation" ON user_current_conversation
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own current conversation" ON user_current_conversation
  FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_conversations_updated_at
  BEFORE UPDATE ON user_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_current_conversation_updated_at
  BEFORE UPDATE ON user_current_conversation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 
