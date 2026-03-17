"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps { title: string; }

export function Header({ title }: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 sticky top-0 z-10 bg-white border-b border-zinc-200">
      <h1 className="text-sm font-bold text-zinc-900">{title}</h1>

      {user && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="ユーザーメニューを開く"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-zinc-100"
          >
            {user.user_metadata?.avatar_url ? (
              <Image src={user.user_metadata.avatar_url} alt="プロフィール画像" width={26} height={26} className="rounded-full" />
            ) : (
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={13} className="text-primary-600" aria-hidden="true" />
              </div>
            )}
            <span className="text-sm text-zinc-600 hidden sm:block">
              {user.user_metadata?.full_name ?? user.email}
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-zinc-200 rounded-xl shadow-card-md z-20 py-1 animate-fade-in">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <LogOut size={14} aria-hidden="true" />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
