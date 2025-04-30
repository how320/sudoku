"use client";

import AuthButtons from "../../components/AuthButtons";

export default function NavBar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex space-x-8">
            <AuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}
