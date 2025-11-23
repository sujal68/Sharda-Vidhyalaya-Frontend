interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ icon, label, value, color = 'sky' }: StatCardProps) {
  const colorClasses = {
    sky: 'from-sky-400 to-blue-500 shadow-sky-500/30',
    green: 'from-emerald-400 to-green-500 shadow-green-500/30',
    purple: 'from-violet-400 to-purple-500 shadow-purple-500/30',
    orange: 'from-amber-400 to-orange-500 shadow-orange-500/30',
  };

  const iconColorClasses = {
    sky: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
    green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  };

  return (
    <div className="stat-card group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex-1 z-10">
        <p className="text-sm font-medium text-muted mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          {value}
        </p>
      </div>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconColorClasses[color as keyof typeof iconColorClasses]} group-hover:scale-110 transition-transform duration-300`}>
        <i className={`${icon} text-2xl`}></i>
      </div>

      {/* Decorative Gradient Background */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
    </div>
  );
}
