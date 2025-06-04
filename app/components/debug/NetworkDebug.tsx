'use client'

import React, { useState } from 'react'
import { get, post } from '@/service/base'

const NetworkDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('')

  const testEmptyResponse = async () => {
    try {
      setDebugInfo('🧪 测试空响应处理...')

      // 尝试调用一个可能返回空响应的endpoint
      const result = await get('/test-empty')
      setDebugInfo(`✅ 空响应测试成功: ${JSON.stringify(result)}`)
    }
    catch (error) {
      setDebugInfo(`✅ 空响应错误处理正常: ${error}`)
    }
  }

  const testInvalidJson = async () => {
    try {
      setDebugInfo('🧪 测试无效JSON响应处理...')

      // 尝试调用一个可能返回无效JSON的endpoint
      const result = await post('/test-invalid-json')
      setDebugInfo(`✅ 无效JSON测试成功: ${JSON.stringify(result)}`)
    }
    catch (error) {
      setDebugInfo(`✅ 无效JSON错误处理正常: ${error}`)
    }
  }

  const testConversationApi = async () => {
    try {
      setDebugInfo('🧪 测试对话API...')

      const result = await get('/conversations')
      setDebugInfo(`✅ 对话API测试成功: ${JSON.stringify(result, null, 2)}`)
    }
    catch (error) {
      setDebugInfo(`❌ 对话API错误: ${error}`)
    }
  }

  const testSupabaseConnection = async () => {
    try {
      setDebugInfo('🧪 测试Supabase连接...')

      const { supabase } = await import('@/utils/supabaseClient')
      const { data, error } = await supabase.from('user_conversations').select('count').limit(1)

      if (error)
        setDebugInfo(`❌ Supabase连接失败: ${error.message}`)
      else
        setDebugInfo(`✅ Supabase连接成功: ${JSON.stringify(data)}`)
    }
    catch (error) {
      setDebugInfo(`❌ Supabase测试错误: ${error}`)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 max-w-md shadow-lg z-50">
      <h3 className="font-bold mb-3 text-sm">网络调试工具</h3>

      <div className="space-y-2 mb-3">
        <button
          onClick={testConversationApi}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          测试对话API
        </button>

        <button
          onClick={testSupabaseConnection}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          测试Supabase连接
        </button>

        <button
          onClick={testEmptyResponse}
          className="w-full px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
        >
          测试空响应处理
        </button>

        <button
          onClick={testInvalidJson}
          className="w-full px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          测试无效JSON处理
        </button>

        <button
          onClick={() => setDebugInfo('')}
          className="w-full px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          清除日志
        </button>
      </div>

      <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
        <pre className="whitespace-pre-wrap">{debugInfo || '点击按钮进行网络测试...'}</pre>
      </div>
    </div>
  )
}

export default NetworkDebug
