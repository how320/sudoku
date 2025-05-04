import React from 'react';
import Link from 'next/link';

interface GameHistoryProps {
  refreshTrigger?: boolean;
}

export default function GameHistory({}: GameHistoryProps) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Link href="history">
        查看完整游戏历史记录
      </Link>
      <Link href="game">
        返回游戏
      </Link>
    </div>
  );
}
