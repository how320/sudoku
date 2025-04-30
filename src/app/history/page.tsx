'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useSession } from '@supabase/auth-helpers-react'
import styles from '../components/Sudoku.module.css'

type GameHistory = {
  id: string
  difficulty: string
  time_seconds: number
  completed_at: string
}

export default function HistoryPage() {
  const session = useSession()
  const [history, setHistory] = useState<GameHistory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('id, difficulty, time_seconds, completed_at')
        .eq('user_id', session.user.id)
        .order('completed_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('获取游戏历史失败:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  if (!session) return <div className={styles.empty}>请登录查看游戏记录</div>
  if (loading) return <div className={styles.loading}>加载中...</div>
  if (history.length === 0) return <div className={styles.empty}>暂无游戏记录</div>

  return (
    <div className={styles.history}>
      <div className="mb-4">
        <Link 
          href="/game" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回游戏
        </Link>
      </div>
      <h3>游戏历史记录</h3>
      <ul>
        {history.map(game => (
          <li key={game.id} className={styles.historyItem}>
            <span>难度: {game.difficulty}</span>
            <span>用时: {Math.floor(game.time_seconds/60)}分{game.time_seconds%60}秒</span>
            <span>完成时间: {new Date(game.completed_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
