declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module './Sudoku' {
  import { FC } from 'react';
  const Sudoku: FC;
  export default Sudoku;
}
