'use client'

import React from 'react'
import { useState } from 'react'
import { useSupabase } from '../../providers/AuthProvider'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const supabase = useSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
      }
      // 强制刷新页面确保状态更新
      window.location.href = '/game'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }


  return (
    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        {mode === 'login' ? '登录' : '注册'}
      </h2>
      
      {error && <div className="mb-4 text-red-500">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-900">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-900">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded text-gray-900"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {mode === 'login' ? '登录' : '注册'}
          </button>          
        </form>

      <div className="mt-4 text-center">
        {mode === 'login' ? (
          <React.Fragment>
            没有账号？{' '}
            <button 
              onClick={() => setMode('signup')}
              className="text-blue-500 hover:underline"
            >
              注册
            </button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            已有账号？{' '}
            <button 
              onClick={() => setMode('login')}
              className="text-blue-500 hover:underline"
            >
              登录
            </button>
          </React.Fragment>
        )}
      </div>

    </div>
  )
}
