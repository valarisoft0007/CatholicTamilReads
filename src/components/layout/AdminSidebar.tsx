"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "&#9632;" },
  { href: "/admin/books", label: "Books", icon: "&#9733;" },
];

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [router]);

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-gold text-lg">&#10013;</span>
          <span className="font-semibold">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold-dark font-medium"
                  : "text-muted hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground transition-colors"
        >
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-card-hover transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
