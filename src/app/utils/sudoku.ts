// 数独生成和验证工具函数
export function generateSudoku(difficulty: 'easy' | 'medium' | 'hard' = 'easy'): number[][] {
  // 生成完整解
  const solution = Array(9).fill(0).map(() => Array(9).fill(0));
  fillDiagonalBoxes(solution);
  solveSudoku(solution);
  
  // 创建题目副本
  const puzzle = solution.map(row => [...row]);
  
  // 根据难度移除数字
  const cellsToRemove = difficulty === 'easy' ? 40 : 
                       difficulty === 'medium' ? 50 : 60;
  removeNumbers(puzzle, cellsToRemove);
  
  return puzzle;
}

function fillDiagonalBoxes(board: number[][]) {
  for (let box = 0; box < 9; box += 3) {
    fillBox(board, box, box);
  }
}

function fillBox(board: number[][], row: number, col: number) {
  const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
  let index = 0;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = nums[index++];
    }
  }
}

export function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function removeNumbers(board: number[][], count: number) {
  while (count > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      count--;
    }
  }
}

export function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // 检查当前单元格是否为空
  if (board[row][col] !== 0 && board[row][col] !== num) return false;

  // 检查行是否有重复
  for (let x = 0; x < 9; x++) {
    if (x !== col && board[row][x] === num) return false;
  }
  
  // 检查列是否有重复
  for (let x = 0; x < 9; x++) {
    if (x !== row && board[x][col] === num) return false;
  }
  
  // 检查3x3宫格是否有重复
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentRow = boxRow + i;
      const currentCol = boxCol + j;
      if (currentRow !== row && currentCol !== col && board[currentRow][currentCol] === num) {
        return false;
      }
    }
  }
  
  return true;
}

export function isBoardComplete(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0 || !isValid(board, row, col, board[row][col])) {
        return false;
      }
    }
  }
  return true;
}
