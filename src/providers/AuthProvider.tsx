/* eslint-disable no-var */
'use client'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createContext, useContext } from 'react'

declare global {
  var __supabaseClient: ReturnType<typeof createPagesBrowserClient> | undefined
}

const SupabaseClientContext = createContext<ReturnType<typeof createPagesBrowserClient>>(null!)

export function useSupabase() {
  return useContext(SupabaseClientContext)
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  if (!global.__supabaseClient) {
    global.__supabaseClient = createPagesBrowserClient()
  }

  return (
    <SessionContextProvider 
      supabaseClient={global.__supabaseClient}
      initialSession={null}
    >
      <SupabaseClientContext.Provider value={global.__supabaseClient}>
        {children}
      </SupabaseClientContext.Provider>
    </SessionContextProvider>
  )
}
