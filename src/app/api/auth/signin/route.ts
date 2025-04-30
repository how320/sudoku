import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })
  const url = new URL(request.url)
  const callbackUrl = url.searchParams.get('callbackUrl') || '/'

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    // 如果密码登录失败，尝试匿名登录
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
    if (anonError) {
      return NextResponse.json({ error: '登录失败，请重试' }, { status: 401 })
    }
    return NextResponse.json(anonData, {
      headers: {
        'Set-Cookie': request.headers.get('Set-Cookie') || '',
        'Location': callbackUrl
      },
      status: 302
    })
  }

  return NextResponse.json(data, {
    headers: {
      'Set-Cookie': request.headers.get('Set-Cookie') || '',
      'Location': callbackUrl
    },
    status: 302
  })
}
