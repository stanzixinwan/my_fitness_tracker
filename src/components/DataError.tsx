import { AppShell } from "@/components/AppShell";

export function DataError({ message }: { message: string }) {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-rose-300/30 bg-rose-300/10 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-200">Database</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Could not load records</h2>
        <p className="mt-4 max-w-2xl text-rose-50/90">{message}</p>
      </section>
    </AppShell>
  );
}
