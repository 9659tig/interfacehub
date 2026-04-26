export function Header() {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">InterfaceHub</h1>
          <p className="text-sm text-slate-500">AI 기반 금융 IT 인터페이스 통합관리</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          System Online
        </div>
      </div>
    </header>
  );
}
