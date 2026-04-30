import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { completionPercent } from "@/lib/domain/nutrition";
import { summarizeTraining } from "@/lib/domain/training";
import {
  activeGoal,
  foodEntries,
  getTodayNutritionSnapshot,
  plannedTraining,
  sampleProfile,
  todayLog,
} from "@/lib/sample-data";

export default function Home() {
  const { targets, consumed, remaining } = getTodayNutritionSnapshot();
  const training = summarizeTraining(plannedTraining);
  const proteinCompletion = completionPercent(consumed.proteinG, targets.proteinG);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Today
          </p>
          <h2 className="mt-3 text-4xl font-semibold">
            {sampleProfile.displayName}, 今天按稳定规则追踪
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            目标是{activeGoal.title}。应用保存结构化资料和记录，LLM 只基于这些事实给出当天建议。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="剩余热量"
              value={`${remaining.calories} kcal`}
              detail={`目标 ${targets.calories} kcal，已吃 ${consumed.calories} kcal`}
            />
            <StatCard
              label="蛋白质完成度"
              value={`${proteinCompletion}%`}
              detail={`${consumed.proteinG}g / ${targets.proteinG}g`}
            />
            <StatCard
              label="今日训练"
              value={todayLog.trainingStatus}
              detail={training.label}
            />
          </div>
        </div>
        <aside className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
          <h3 className="text-xl font-semibold text-emerald-100">记忆边界</h3>
          <p className="mt-3 text-sm leading-6 text-emerald-50/80">
            身体数据、目标和偏好都进入数据库模型；提示词只读取需要的事实。这样能减少不同对话语气造成的建议漂移。
          </p>
          <ul className="mt-6 space-y-3 text-sm text-emerald-50/80">
            <li>长期目标：{activeGoal.title}</li>
            <li>今日安排：{todayLog.scheduleNote}</li>
            <li>已记录食物：{foodEntries.length} 条</li>
          </ul>
        </aside>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Protein", consumed.proteinG, targets.proteinG, "g"],
          ["Carbs", consumed.carbsG, targets.carbsG, "g"],
          ["Fat", consumed.fatG, targets.fatG, "g"],
          ["Calories", consumed.calories, targets.calories, "kcal"],
        ].map(([label, value, target, unit]) => (
          <div key={label} className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {value}
              <span className="text-base text-slate-400">
                {" "}
                / {target} {unit}
              </span>
            </p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
