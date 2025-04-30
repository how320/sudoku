"use client";

import SudokuBoard from './SudokuBoard';
import styles from './Sudoku.module.css';

export default function Sudoku() {
  return (
    <div className={styles.container}>
      <div>
        <SudokuBoard />
      </div>
    </div>
  );
}
