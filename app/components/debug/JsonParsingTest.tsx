'use client'

import React, { useState } from 'react'

const JsonParsingTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('')

  // 模拟 safeJsonParse 函数的本地版本用于测试
  const localSafeJsonParse = async (response: Response): Promise<any> => {
    const text = await response.text()
    if (!text.trim())
      throw new Error('Empty response')

    try {
      return JSON.parse(text)
    }
    catch (error) {
      console.warn('Failed to parse JSON:', text)
      throw new Error('Invalid JSON response')
    }
  }

  const testValidJson = async () => {
    try {
      setTestResult('🧪 测试有效JSON...')

      // 创建一个模拟的有效JSON响应
      const mockResponse = new Response(JSON.stringify({ message: 'success', data: { id: 1 } }), {
        headers: { 'content-type': 'application/json' },
      })

      const result = await localSafeJsonParse(mockResponse)
      setTestResult(`✅ 有效JSON解析成功:\n${JSON.stringify(result, null, 2)}`)
    }
    catch (error) {
      setTestResult(`❌ 有效JSON解析失败: ${error}`)
    }
  }

  const testInvalidJson = async () => {
    try {
      setTestResult('🧪 测试无效JSON...')

      // 创建一个模拟的无效JSON响应
      const mockResponse = new Response('{ invalid json }', {
        headers: { 'content-type': 'application/json' },
      })

      const result = await localSafeJsonParse(mockResponse)
      setTestResult(`❌ 无效JSON应该失败但成功了: ${JSON.stringify(result)}`)
    }
    catch (error) {
      setTestResult(`✅ 无效JSON正确处理了错误: ${error.message}`)
    }
  }

  const testEmptyResponse = async () => {
    try {
      setTestResult('🧪 测试空响应...')

      // 创建一个模拟的空响应
      const mockResponse = new Response('', {
        headers: { 'content-type': 'application/json' },
      })

      const result = await localSafeJsonParse(mockResponse)
      setTestResult(`❌ 空响应应该失败但成功了: ${JSON.stringify(result)}`)
    }
    catch (error) {
      setTestResult(`✅ 空响应正确处理了错误: ${error.message}`)
    }
  }

  const testWhitespaceResponse = async () => {
    try {
      setTestResult('🧪 测试只有空白字符的响应...')

      // 创建一个模拟的只有空白字符的响应
      const mockResponse = new Response('   \n\t  ', {
        headers: { 'content-type': 'application/json' },
      })

      const result = await localSafeJsonParse(mockResponse)
      setTestResult(`❌ 空白字符响应应该失败但成功了: ${JSON.stringify(result)}`)
    }
    catch (error) {
      setTestResult(`✅ 空白字符响应正确处理了错误: ${error.message}`)
    }
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 max-w-md shadow-lg z-50">
      <h3 className="font-bold mb-3 text-sm">safeJsonParse 测试</h3>

      <div className="space-y-2 mb-3">
        <button
          onClick={testValidJson}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          测试有效JSON
        </button>

        <button
          onClick={testInvalidJson}
          className="w-full px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          测试无效JSON
        </button>

        <button
          onClick={testEmptyResponse}
          className="w-full px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
        >
          测试空响应
        </button>

        <button
          onClick={testWhitespaceResponse}
          className="w-full px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
        >
          测试空白字符响应
        </button>

        <button
          onClick={() => setTestResult('')}
          className="w-full px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          清除结果
        </button>
      </div>

      <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
        <pre className="whitespace-pre-wrap">{testResult || 'safeJsonParse 现在用于:\n- baseFetch 错误处理\n- ssePost 错误处理\n- 正常响应解析\n\n点击按钮测试各种场景...'}</pre>
      </div>
    </div>
  )
}

export default JsonParsingTest
