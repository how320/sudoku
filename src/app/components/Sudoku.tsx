"use client";

import SudokuBoard from './SudokuBoard';
import styles from './Sudoku.module.css';

export default function Sudoku() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>数独游戏</h1>
      <div className={styles.rules}>
        <h3>游戏规则：</h3>
        <ol>
          <li>每个3×3宫格内填入1-9的数字，不能重复</li>
          <li>每一行填入1-9的数字，不能重复</li>
          <li>每一列填入1-9的数字，不能重复</li>
        </ol>
        <p>点击单元格选择，使用数字键盘或下方按钮填写数字</p>
      </div>
      <SudokuBoard />
    </div>
  );
}
