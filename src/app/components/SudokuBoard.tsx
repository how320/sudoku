'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { generateSudoku, isBoardComplete, isValid } from '../utils/sudoku'
import styles from './Sudoku.module.css'
import { supabase } from '../../lib/supabase'
import { useSession } from '@supabase/auth-helpers-react'

type CellProps = {
  value: number
  isInitial: boolean
  isInvalid: boolean
  onClick: () => void
  isSelected: boolean
  isHighlighted: boolean
}

function Cell({ value, isInitial, isInvalid, onClick, isSelected, isHighlighted }: CellProps) {
  return (
    <div 
      className={`${styles.cell} 
        ${isInitial ? styles.initial : ''} 
        ${isInvalid ? styles.invalid : ''}
        ${isSelected ? styles.selected : ''}
        ${isHighlighted ? styles.highlighted : ''}
      `}
      onClick={onClick}
    >
      {value !== 0 ? value : ''}
    </div>
  )
}

type SudokuBoardProps = {
  onGameComplete?: () => void
}

export default function SudokuBoard({ onGameComplete }: SudokuBoardProps) {
  const session = useSession()
  const [board, setBoard] = useState<number[][] | null>(null)
  const [initialBoard, setInitialBoard] = useState<number[][] | null>(null)
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [invalidCells, setInvalidCells] = useState<boolean[][] | null>(null)
  const [highlightedCells, setHighlightedCells] = useState<[number, number][]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [bestTime, setBestTime] = useState<number | null>(null)

  const startNewGame = useCallback(() => {
    try {
      const newBoard = generateSudoku('easy')
      const newInvalidCells = Array(9).fill(null).map(() => Array(9).fill(false))
      setBoard(newBoard.map(row => [...row]))
      setInitialBoard(newBoard.map(row => [...row]))
      setInvalidCells(newInvalidCells)
      setSelectedCell(null)
      setTime(0)
      setIsRunning(true)
      setIsComplete(false)
    } catch (error) {
      console.error('开始新游戏失败:', error)
      // 设置空状态以显示错误
      setBoard(Array(9).fill(0).map(() => Array(9).fill(0)))
      setInitialBoard(Array(9).fill(0).map(() => Array(9).fill(0)))
      setInvalidCells(Array(9).fill(null).map(() => Array(9).fill(false)))
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
      
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])


  useEffect(() => {
    const loadBestTime = async () => {
      if (session?.user?.id) {
        // 查询数据库获取最佳成绩
        const { data, error } = await supabase
          .from('game_history')
          .select('time_seconds')
          .eq('user_id', session.user.id)
          .eq('is_completed', true)
          .order('time_seconds', { ascending: true })
          .limit(1)
          
        if (!error && data && data.length > 0) {
          setBestTime(data[0].time_seconds)
        }
      } else {
        // 从cookie获取最佳成绩
        const cookieTime = document.cookie
          .split('; ')
          .find(row => row.startsWith('best_time='))
          ?.split('=')[1]
        
        if (cookieTime) {
          setBestTime(parseInt(cookieTime))
        }
      }
    }

    try {
      startNewGame()
      setTime(0)
      setIsRunning(true)
      loadBestTime()
    } catch (error) {
      console.error('初始化数独板失败:', error)
    }
  }, [startNewGame, session])

  // 检查游戏是否完成
  const prevIsComplete = useRef(false)
  useEffect(() => {
    if (board) {
      const isComplete = isBoardComplete(board)
      if (isComplete && !prevIsComplete.current) {  // 只在从未完成变为完成时执行
        prevIsComplete.current = true
        setIsRunning(false)
        setIsComplete(true)
        // 保存游戏记录时会自动更新最佳成绩
        if (session?.user?.id) {
          supabase
            .from('game_history')
            .insert({
              user_id: session.user.id,
              difficulty: 'easy', // 暂时固定为easy
              time_seconds: time,
              is_completed: true
            })
            .then(({ error }) => {
              if (error) {
                console.error('保存游戏记录失败:', error)
              } else {
                // 更新最佳成绩
                if (!bestTime || time < bestTime) {
                  setBestTime(time)
                  if (!session?.user?.id) {
                    // 未登录用户保存到cookie
                    document.cookie = `best_time=${time}; max-age=31536000; path=/`
                  }
                }
              }
              onGameComplete?.()
            })
        }
      } else {
        setIsComplete(false)
        prevIsComplete.current = false
      }
    }
  }, [board, time, session, onGameComplete, bestTime])

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col])
    if (board && board[row][col] !== 0) {
      const sameNumberCells: [number, number][] = []
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === board[row][col]) {
            sameNumberCells.push([r, c])
          }
        }
      }
      setHighlightedCells(sameNumberCells)
    } else {
      setHighlightedCells([])
    }
  }

  const handleNumberInput = (num: number) => {
    if (!selectedCell || !board || !initialBoard) return
    
    const [row, col] = selectedCell
    
    // 清除操作时重置所有状态（仅允许清除非初始数字）
    if (num === 0) {
      if (initialBoard[row][col] !== 0) return
      
      const newBoard = board.map(row => [...row])
      newBoard[row][col] = 0
      
      // 保留其他错误标记，只清除当前格子的错误状态
      const newInvalidCells = invalidCells!.map(row => [...row])
      newInvalidCells[row][col] = false
      
      setBoard(newBoard)
      setInvalidCells(newInvalidCells)
      setHighlightedCells([])
      return
    }
    
    // 初始数字不能被修改
    if (initialBoard[row][col] !== 0) return
    
    const newBoard = board.map(row => [...row])
    newBoard[row][col] = num
    
    // 验证当前输入是否有效
    const isValidInput = isValid(newBoard, row, col, num)
    
    // 保留现有的错误标记
    const newInvalidCells = invalidCells!.map(row => [...row])
    newInvalidCells[row][col] = !isValidInput
    
    // 强制同步更新状态
    setInvalidCells(newInvalidCells)
    setBoard([...newBoard])
    
    // 如果错误，保持选中状态以便用户立即看到
    if (!isValidInput) {
      setSelectedCell([row, col])
    }
    
    // 高亮所有相同数字的格子
    const sameNumberCells: [number, number][] = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (newBoard[r][c] === num) {
          sameNumberCells.push([r, c])
        }
      }
    }
    setHighlightedCells(sameNumberCells)
  }

  const isCellInvalid = (row: number, col: number) => {
    return invalidCells![row][col]
  }

  const isNumberComplete = (num: number) => {
    if (!board) return false
    // 检查每个3x3宫格是否都包含该数字
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        let found = false
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
          for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            if (board[r][c] === num) {
              found = true
              break
            }
          }
          if (found) break
        }
        if (!found) return false
      }
    }
    return true
  }

  if (!board || !initialBoard || !invalidCells) {
    return <div className={styles['sudoku-board']}>加载中...</div>
  }

  return (
    <div className={styles['sudoku-board']} style={{ border: '1px solid red' }}>
      <div className={styles.controls}>
        <button 
          onClick={startNewGame}
          style={{ backgroundColor: '#1e90ff', color: 'white', padding: '8px 16px', borderRadius: '4px' }}
        >
          新游戏
        </button>
        <button 
          onClick={() => initialBoard && setBoard(initialBoard.map(row => [...row]))}
          style={{ backgroundColor: '#ff8c00', color: 'white', padding: '8px 16px', borderRadius: '4px', marginLeft: '10px' }}
        >
          重开
        </button>
        <div style={{ 
          marginLeft: '20px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#333'
        }}>
          用时: {Math.floor(time/60)}:{time%60 < 10 ? '0' + time%60 : time%60}
          {bestTime && (
            <span style={{ marginLeft: '10px' }}>
              最佳: {Math.floor(bestTime/60)}:{bestTime%60 < 10 ? '0' + bestTime%60 : bestTime%60}
            </span>
          )}
        </div>
      </div>
      <div className={styles['number-pad']}>
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button 
            key={num}
            onClick={() => selectedCell && handleNumberInput(num)}
            disabled={!selectedCell || isNumberComplete(num)}
            style={isNumberComplete(num) ? { opacity: 0.5 } : {}}
          >
            {num}
          </button>
        ))}
        <button 
          className={styles.clear}
          onClick={() => selectedCell && handleNumberInput(0)}
          disabled={!selectedCell}
        >
          清除
        </button>
      </div>
      {isComplete && (
        <div className={styles.completionMessage}>
          恭喜完成！用时: {Math.floor(time/60)}分{time%60}秒
        </div>
      )}
      <div className={styles.grid}>
        {board.flat().map((cell, index) => {
          const rowIndex = Math.floor(index / 9);
          const colIndex = index % 9;
          return (
            <Cell
              key={index}
              value={cell}
              isInitial={initialBoard[rowIndex][colIndex] !== 0}
              isInvalid={isCellInvalid(rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              isSelected={selectedCell?.toString() === [rowIndex, colIndex].toString()}
              isHighlighted={highlightedCells.some(([r, c]) => r === rowIndex && c === colIndex)}
            />
          );
        })}
      </div>
    </div>
  )
}
