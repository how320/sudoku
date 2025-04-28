import Sudoku from "./components/Sudoku";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl py-8">
        <Sudoku />
      </div>
    </main>
  );
}
