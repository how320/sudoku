'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Link from 'next/link'

export default function AuthButtons() {
  const session = useSession()
  const supabase = useSupabaseClient()

  const isAnonymous = session?.user?.identities?.some(identity => identity.provider === 'anon')
  
  return (
    <div className="flex gap-2">
      <Link
        href="rules"
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        游戏规则
      </Link>
      
      {session && !isAnonymous && (
        <Link
          href="history"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          历史记录
        </Link>
      )}
      
      {session ? (
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          登出
        </button>
      ) : (
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          登录
        </Link>
      )}
    </div>
  )
}
