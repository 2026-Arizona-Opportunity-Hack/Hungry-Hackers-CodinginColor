"use client";

import { CheckCircle2, CircleDashed, TrendingUp } from "lucide-react";
import { Card, Loading, PageTitle, ProgressBar } from "@/components/ui";
import { moduleComplete, moduleDoneCount, moduleGain, pct, signedPct, studentGain } from "@/lib/analytics";
import { useStudent } from "@/lib/use-student";

export default function MyProgress() {
  const ctx = useStudent();
  if (!ctx) return <Loading />;
  const { modules, progress, course } = ctx;
  const overall = studentGain(progress, modules);

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="My progress" subtitle={course.title} />

      <Card className="border-2 border-cic-dark">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <TrendingUp aria-hidden className="size-5 text-cic-dark" /> My learning gain
        </h2>
        {overall.gain === null ? (
          <p className="mt-2 text-cic-muted">Finish a module&apos;s warm-up and wrap-up quiz to see how much you&apos;ve grown.</p>
        ) : (
          <>
            <p className="mt-1 text-cic-muted">
              Average across {overall.modules} finished module{overall.modules === 1 ? "" : "s"}: wrap-up score minus warm-up score.
            </p>
            <div className="mt-4 flex items-end gap-6" aria-hidden>
              {[
                { label: "Warm-up", v: overall.pre ?? 0, cls: "bg-cic-tint ring-1 ring-cic-line ring-inset" },
                { label: "Wrap-up", v: overall.post ?? 0, cls: "bg-cic-dark" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center">
                  <span className="mb-1 font-bold">{pct(b.v)}</span>
                  <div className="flex h-36 w-16 items-end rounded-lg bg-white">
                    <div className={`w-full rounded-lg ${b.cls}`} style={{ height: `${Math.max(4, b.v * 100)}%` }} />
                  </div>
                  <span className="mt-1 text-sm text-cic-muted">{b.label}</span>
                </div>
              ))}
              <p className="mb-8 text-3xl font-bold text-cic-dark">{signedPct(overall.gain)}</p>
            </div>
            <p className="sr-only">
              Warm-up average {pct(overall.pre)}, wrap-up average {pct(overall.post)}, learning gain {signedPct(overall.gain)}.
            </p>
          </>
        )}
      </Card>

      <h2 className="mt-8 text-xl font-bold">By module</h2>
      <div className="mt-3 overflow-x-auto rounded-[var(--radius-card)] border border-cic-line">
        <table className="w-full min-w-[560px] text-left">
          <caption className="sr-only">Progress and learning gain for each module</caption>
          <thead className="bg-cic-dark text-white">
            <tr>
              <th scope="col" className="p-3">Module</th>
              <th scope="col" className="p-3">Progress</th>
              <th scope="col" className="p-3">Warm-up</th>
              <th scope="col" className="p-3">Wrap-up</th>
              <th scope="col" className="p-3">Gain</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m, i) => {
              const g = moduleGain(progress, m);
              const done = moduleComplete(progress, m);
              const n = moduleDoneCount(progress, m);
              return (
                <tr key={m.id} className={i % 2 ? "bg-cic-tint" : "bg-white"}>
                  <th scope="row" className="p-3 font-bold">
                    {m.number}. {m.title}
                  </th>
                  <td className="p-3">
                    <span className="flex items-center gap-2 text-sm">
                      {done ? <CheckCircle2 aria-hidden className="size-4 text-cic-dark" /> : <CircleDashed aria-hidden className="size-4 text-cic-muted" />}
                      {n}/{m.activities.length}
                    </span>
                    <ProgressBar className="mt-1 max-w-32" value={n / m.activities.length} label={`Module ${m.number} progress`} />
                  </td>
                  <td className="p-3">{pct(g.pre)}</td>
                  <td className="p-3">{pct(g.post)}</td>
                  <td className="p-3 font-bold">{signedPct(g.gain)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
