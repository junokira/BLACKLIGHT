export default function TailwindProbe() {
  return (
    <div className="min-h-[40vh] grid place-items-center bg-slate-100">
      <div className="rounded-2xl border p-6 text-center">
        <div className="text-3xl font-black tracking-tight">Tailwind OK</div>
        <div className="mt-2 text-sm text-slate-600">
          If this box is centered with rounded corners and a border, Tailwind is working.
        </div>
        <button className="mt-4 px-4 py-2 rounded bg-black text-white hover:opacity-80 transition">
          Test Button
        </button>
      </div>
    </div>
  )
}


