'use client'

import Sudoku from '../components/Sudoku'
import NavBar from '../components/NavBar'

export default function GamePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <NavBar />
      <div className="w-full max-w-4xl py-8">
        <Sudoku />
      </div>
    </main>
  )
}
