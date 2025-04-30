'use client'
import LoginForm from './components/LoginForm'
import { supabase } from '../lib/supabase'
import { useSession } from '@supabase/auth-helpers-react'

export default function Home() {
  const session = useSession()
  
  if (session) {
    window.location.href = '/game'
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <LoginForm />
      <div className="mt-8">
        <button
          onClick={async () => {
            try {
              console.log('尝试匿名登录...')
              const { data, error } = await supabase.auth.signInAnonymously()
              
              console.log('登录结果:', { data, error })
              
              if (error) throw error
              
              // 检查当前会话
              const session = await supabase.auth.getSession()
              console.log('当前会话:', session)
              
              if (!session.data.session) {
                throw new Error('未获取到有效会话')
              }
              
              // 等待1秒确保会话已更新
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              console.log('跳转到游戏页面...')
              window.location.href = '/game'
            } catch (err) {
              const error = err as Error
              console.error('匿名登录失败:', error)
              alert(`匿名登录失败: ${error.message}`)
            }
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          匿名游玩
        </button>
      </div>
    </main>
  )
}
