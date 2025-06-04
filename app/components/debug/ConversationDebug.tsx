'use client'

import React, { useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import useConversation from '@/hooks/use-conversation'

const ConversationDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('')
  const {
    conversationList,
    saveConversationToStorage,
    getConversationListFromSupabase,
    saveConversationListToSupabase,
  } = useConversation()

  const testSaveConversation = async () => {
    try {
      const testConversation = {
        id: `test-${Date.now()}`,
        name: '测试对话',
        inputs: { question: '这是一个测试' },
        introduction: '这是一个测试对话',
      }

      await saveConversationToStorage('test-app', testConversation)
      setDebugInfo(`✅ 成功保存测试对话: ${testConversation.name}`)
    }
    catch (error) {
      setDebugInfo(`❌ 保存失败: ${error}`)
    }
  }

  const testGetConversations = async () => {
    try {
      const conversations = await getConversationListFromSupabase('test-app')
      setDebugInfo(`✅ 获取到 ${conversations.length} 条对话:\n${JSON.stringify(conversations, null, 2)}`)
    }
    catch (error) {
      setDebugInfo(`❌ 获取失败: ${error}`)
    }
  }

  const testSaveCurrentList = async () => {
    try {
      await saveConversationListToSupabase('test-app', conversationList)
      setDebugInfo(`✅ 成功保存当前对话列表 (${conversationList.length} 条)`)
    }
    catch (error) {
      setDebugInfo(`❌ 保存列表失败: ${error}`)
    }
  }

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user)
        setDebugInfo(`✅ 用户已登录: ${user.email}\nUser ID: ${user.id}`)
      else
        setDebugInfo('❌ 用户未登录')
    }
    catch (error) {
      setDebugInfo(`❌ 检查用户状态失败: ${error}`)
    }
  }

  const checkTables = async () => {
    try {
      const { data: conversations, error: convError } = await supabase
        .from('user_conversations')
        .select('*')
        .limit(5)

      const { data: current, error: currentError } = await supabase
        .from('user_current_conversation')
        .select('*')
        .limit(5)

      if (convError || currentError)
        setDebugInfo(`❌ 数据库错误:\nConversations: ${convError?.message}\nCurrent: ${currentError?.message}`)
      else
        setDebugInfo(`✅ 数据库连接正常:\nuser_conversations: ${conversations?.length || 0} 条记录\nuser_current_conversation: ${current?.length || 0} 条记录`)
    }
    catch (error) {
      setDebugInfo(`❌ 检查数据库失败: ${error}`)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 max-w-md shadow-lg z-50">
      <h3 className="font-bold mb-3 text-sm">对话同步调试</h3>

      <div className="space-y-2 mb-3">
        <button
          onClick={checkUserStatus}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          检查用户状态
        </button>

        <button
          onClick={checkTables}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          检查数据库表
        </button>

        <button
          onClick={testSaveConversation}
          className="w-full px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          测试保存对话
        </button>

        <button
          onClick={testSaveCurrentList}
          className="w-full px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
        >
          保存当前对话列表
        </button>

        <button
          onClick={testGetConversations}
          className="w-full px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600"
        >
          获取对话列表
        </button>
      </div>

      <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
        <pre className="whitespace-pre-wrap">{debugInfo || '点击按钮进行测试...'}</pre>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        当前对话列表: {conversationList.length} 条
      </div>
    </div>
  )
}

export default ConversationDebug
