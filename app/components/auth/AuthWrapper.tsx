'use client'

import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabaseClient'

type AuthWrapperProps = {
  children: React.ReactNode
  onUserChange?: (user: User | null) => void
}

export default function AuthWrapper({ children, onUserChange }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // 获取当前用户
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      onUserChange?.(user)
    }

    getUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        onUserChange?.(session?.user ?? null)
        if (event === 'SIGNED_IN')
          setShowAuth(false)
      },
    )

    return () => subscription.unsubscribe()
  }, [onUserChange])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录或注册
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登录后可以跨设备同步您的对话历史
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              theme="light"
              providers={[]}
              redirectTo={window.location.origin}
            />
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setShowAuth(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                暂时跳过
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 顶部用户状态栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {user
            ? (
              <span className="text-sm text-gray-700">
                已登录：{user.email}
              </span>
            )
            : (
              <span className="text-sm text-gray-500">未登录（仅本地存储）</span>
            )}
        </div>
        <div className="flex items-center space-x-2">
          {user
            ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                退出登录
              </button>
            )
            : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                登录同步
              </button>
            )}
        </div>
      </div>
      {children}
    </div>
  )
}
