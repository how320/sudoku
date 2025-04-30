"use client";

import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="container">
      <div className="mb-4">
        <Link 
          href="/game" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回游戏
        </Link>
      </div>
      <h1>数独游戏规则</h1>
      <div className="rules">
        <h3>游戏规则：</h3>
        <ol>
          <li>每个3×3宫格内填入1-9的数字，不能重复</li>
          <li>每一行填入1-9的数字，不能重复</li>
          <li>每一列填入1-9的数字，不能重复</li>
        </ol>
        <p>点击单元格选择，使用数字键盘或下方按钮填写数字</p>
      </div>
    </div>
  );
}
