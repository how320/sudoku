import React from 'react';
import Link from 'next/link';

interface GameHistoryProps {
  refreshTrigger?: boolean;
}

export default function GameHistory({}: GameHistoryProps) {
  return (
    <Link href="history">
      查看完整游戏历史记录
    </Link>
  );
}
