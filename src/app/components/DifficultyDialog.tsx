'use client'
import { useState } from 'react'
import styles from './Sudoku.module.css'

type DifficultyDialogProps = {
  onClose: () => void
  onDifficultySelected: (difficulty: 'easy' | 'medium' | 'hard') => void
}

export default function DifficultyDialog({ onClose, onDifficultySelected }: DifficultyDialogProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogContent}>
        <h2>选择游戏难度</h2>
        <div className={styles.difficultyOptions}>
          <label>
            <input 
              type="radio" 
              name="difficulty" 
              value="easy" 
              checked={selectedDifficulty === 'easy'}
              onChange={() => setSelectedDifficulty('easy')}
            />
            容易
          </label>
          <label>
            <input 
              type="radio" 
              name="difficulty" 
              value="medium" 
              checked={selectedDifficulty === 'medium'}
              onChange={() => setSelectedDifficulty('medium')}
            />
            一般
          </label>
          <label>
            <input 
              type="radio" 
              name="difficulty" 
              value="hard" 
              checked={selectedDifficulty === 'hard'}
              onChange={() => setSelectedDifficulty('hard')}
            />
            困难
          </label>
        </div>
        <div className={styles.dialogButtons}>
          <button 
            onClick={() => {
              onDifficultySelected(selectedDifficulty)
              onClose()
            }}
            className={styles.primaryButton}
          >
            开始游戏
          </button>
          <button 
            onClick={onClose}
            className={styles.secondaryButton}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
