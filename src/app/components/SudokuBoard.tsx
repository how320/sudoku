'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import DifficultyDialog from './DifficultyDialog'
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
  isRunning: boolean
}

function Cell({ value, isInitial, isInvalid, onClick, isSelected, isHighlighted, isRunning }: CellProps) {
  return (
    <div 
      className={`${styles.cell} 
        ${isInitial ? styles.initial : ''} 
        ${isInvalid ? styles.invalid : ''}
        ${isSelected ? styles.selected : ''}
        ${isHighlighted ? styles.highlighted : ''}
        ${!isRunning ? styles.disabled : ''}
      `}
      onClick={!isRunning ? undefined : onClick}
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
  const [showPauseOverlay, setShowPauseOverlay] = useState(false)
  const [bestTime, setBestTime] = useState<number | null>(null)

  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false)
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  const startNewGame = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    try {
      const newBoard = generateSudoku(difficulty)
      const newInvalidCells = Array(9).fill(null).map(() => Array(9).fill(false))
      setBoard(newBoard.map(row => [...row]))
      setInitialBoard(newBoard.map(row => [...row]))
      setInvalidCells(newInvalidCells)
      setSelectedCell(null)
      setHighlightedCells([])
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

  // 保存游戏状态到本地存储
  useEffect(() => {
    const gameState = {
      board,
      initialBoard,
      time,
      isRunning,
      showPauseOverlay,
      selectedCell,
      highlightedCells,
      invalidCells
    }
    localStorage.setItem('sudokuGameState', JSON.stringify(gameState))
  }, [board, initialBoard, time, isRunning, showPauseOverlay, selectedCell, highlightedCells, invalidCells])

  // 恢复游戏状态
  useEffect(() => {
    const savedState = localStorage.getItem('sudokuGameState')
    if (savedState) {
      try {
        const {
          board: savedBoard,
          initialBoard: savedInitialBoard,
          time: savedTime,
          isRunning: savedIsRunning,
          showPauseOverlay: savedShowPauseOverlay,
          selectedCell: savedSelectedCell,
          highlightedCells: savedHighlightedCells,
          invalidCells: savedInvalidCells
        } = JSON.parse(savedState)

        // 验证恢复的状态是否有效
        if (savedBoard && savedInitialBoard && savedInvalidCells) {
          setBoard(savedBoard)
          setInitialBoard(savedInitialBoard)
          setTime(savedTime)
          setIsRunning(savedIsRunning)
          setShowPauseOverlay(savedShowPauseOverlay)
          setSelectedCell(savedSelectedCell)
          setHighlightedCells(savedHighlightedCells)
          setInvalidCells(savedInvalidCells)
          return
        }
      } catch (e) {
        console.error('恢复游戏状态失败:', e)
      }
    }
    // 如果没有有效保存状态，则开始新游戏
    startNewGame()
  }, [startNewGame])

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时暂停游戏并保存状态
        setIsRunning(false)
        setShowPauseOverlay(true)
        const gameState = {
          board,
          initialBoard,
          time,
          isRunning: false, // 强制设置为暂停状态
          showPauseOverlay: true, // 强制显示暂停界面
          selectedCell,
          highlightedCells,
          invalidCells
        }
        localStorage.setItem('sudokuGameState', JSON.stringify(gameState))
      } else {
        // 页面恢复时检查是否需要保持暂停状态
        const savedState = localStorage.getItem('sudokuGameState')
        if (savedState) {
          const { isRunning: savedIsRunning, showPauseOverlay: savedShowPauseOverlay } = JSON.parse(savedState)
          setIsRunning(savedIsRunning)
          setShowPauseOverlay(savedShowPauseOverlay)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [board, initialBoard, time, selectedCell, highlightedCells, invalidCells])

  // 计时器
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
  const loadBestTime = async (difficulty: string) => {
    if (session?.user?.id) {
      // 查询数据库获取当前难度的最佳成绩
      const { data, error } = await supabase
        .from('game_history')
        .select('time_seconds')
        .eq('user_id', session.user.id)
        .eq('is_completed', true)
        .eq('difficulty', difficulty)
        .order('time_seconds', { ascending: true })
        .limit(1)
        
      if (!error && data && data.length > 0) {
        setBestTime(data[0].time_seconds)
      } else {
        setBestTime(null)
      }
    } else {
      // 从cookie获取最佳成绩
      console.log('当前cookie:', document.cookie);
      const cookieTime = document.cookie
        .split('; ')
        .find(row => row.startsWith(`best_time_${difficulty}=`))
        ?.split('=')[1];
      
      console.log(`查找best_time_${difficulty}结果:`, cookieTime);
      
      if (cookieTime) {
        const time = parseInt(cookieTime);
        console.log('从cookie读取到最佳用时:', time);
        setBestTime(time);
      } else {
        // 检查旧格式的cookie（不带难度）
        const legacyCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('best_time='))
          ?.split('=')[1];
        console.log('查找旧格式best_time结果:', legacyCookie);
        setBestTime(legacyCookie ? parseInt(legacyCookie) : null);
      }
    }
  }

    const savedState = localStorage.getItem('sudokuGameState')
    if (savedState) {
      const {
        board: savedBoard,
        initialBoard: savedInitialBoard,
        time: savedTime,
        isRunning: savedIsRunning,
        showPauseOverlay: savedShowPauseOverlay
      } = JSON.parse(savedState)

      // 恢复保存的游戏状态
      setBoard(savedBoard)
      setInitialBoard(savedInitialBoard)
      setTime(savedTime)
      setIsRunning(savedIsRunning)
      setShowPauseOverlay(savedShowPauseOverlay)
    } else {
      // 没有保存状态时才开始新游戏
      try {
        startNewGame()
        setTime(0)
        setIsRunning(true)
      } catch (error) {
        console.error('初始化数独板失败:', error)
      }
    }

    loadBestTime(currentDifficulty)
  }, [startNewGame, session, currentDifficulty])

  // 检查游戏是否完成
  const prevIsComplete = useRef(false)
  useEffect(() => {
    if (board) {
      const isComplete = isBoardComplete(board)
      if (isComplete && !prevIsComplete.current) {  // 只在从未完成变为完成时执行
        prevIsComplete.current = true
        setIsRunning(false)
        setIsComplete(true)
        // 
        // 更新最佳成绩
        if (!bestTime || time < bestTime) {
          setBestTime(time);
          console.log('设置新的最佳用时:', time);
          
          if (session?.user?.id) {
            // 登录用户保存到数据库
            supabase
              .from('game_history')
              .insert({
                user_id: session.user.id,
                difficulty: currentDifficulty,
                time_seconds: time,
                is_completed: true
              })
              .then(({ error }) => {
                if (error) {
                  console.error('保存游戏记录失败:', error);
                }
              });
          } else {
            // 匿名用户保存到cookie
            const cookieValue = `best_time_${currentDifficulty}=${time}; max-age=31536000; path=/; SameSite=Lax`;
            console.log('设置匿名用户cookie:', cookieValue);
            document.cookie = cookieValue;
          }
        }
        onGameComplete?.();
      } else {
        setIsComplete(false)
        prevIsComplete.current = false
      }
    }
  }, [board, time, session, onGameComplete, bestTime, currentDifficulty])

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

  const resetGame = useCallback(() => {
    if (!initialBoard) return
    setBoard(initialBoard.map(row => [...row]))
    setInvalidCells(Array(9).fill(null).map(() => Array(9).fill(false)))
    setSelectedCell(null)
    setHighlightedCells([])
    setTime(0) // 重置计时器
    setIsRunning(true) // 自动开始计时
  }, [initialBoard])

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

  // 初始状态处理
  useEffect(() => {
    // 确保初始状态被正确设置
    if (!board || !initialBoard || !invalidCells) {
      startNewGame();
    }
  }, [board, initialBoard, invalidCells, startNewGame]);

  // 如果状态仍未准备好，显示加载状态
  if (!board || !initialBoard || !invalidCells) {
    return (
      <div className={styles['sudoku-board']}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>游戏初始化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['sudoku-board']} style={{ border: '1px solid red' }}>
      <div className={styles.controls}>
        <button 
          onClick={() => setShowDifficultyDialog(true)}
          style={{ backgroundColor: '#1e90ff', color: 'white', padding: '8px 16px', borderRadius: '4px' }}
        >
          新游戏
        </button>
        {showDifficultyDialog && (
          <DifficultyDialog 
            onClose={() => setShowDifficultyDialog(false)}
            onDifficultySelected={(difficulty) => {
              setCurrentDifficulty(difficulty)
              startNewGame(difficulty)
            }}
          />
        )}
        <button 
          onClick={resetGame}
          style={{ backgroundColor: '#ff8c00', color: 'white', padding: '8px 16px', borderRadius: '4px', marginLeft: '10px' }}
        >
          重开
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            padding: '6px 12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            难度: {currentDifficulty === 'easy' ? '简单' : 
                  currentDifficulty === 'medium' ? '中等' : '困难'}
          </span>
          <button 
            onClick={() => {
              if (isComplete) return
              if (isRunning) {
                setShowPauseOverlay(true)
                setIsRunning(false)
              } else {
                setShowPauseOverlay(false)
                setIsRunning(true)
              }
            }}
            disabled={isComplete}
            style={{ 
              backgroundColor: isComplete ? '#cccccc' : (isRunning ? '#ff6347' : '#32cd32'),
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '4px'
            }}
          >
            {isRunning ? '暂停' : '继续'}
          </button>
          <div style={{ 
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
              isRunning={isRunning}
            />
          );
        })}
      </div>
      {showPauseOverlay && (
        <div className={styles.pauseOverlay}>
          <div className={styles.pauseContent}>
            <h2>休息一下</h2>
            <button 
              onClick={() => {
                setShowPauseOverlay(false)
                setIsRunning(true)
              }}
              className={styles.resumeButton}
            >
              继续游戏
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
