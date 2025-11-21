interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ icon, label, value, color = 'sky' }: StatCardProps) {
  const colorClasses = {
    sky: 'text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-950',
    green: 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-950',
    purple: 'text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950',
    orange: 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
  };

  return (
    <div className="stat-card">
      <div className="flex-1">
        <p className="text-sm text-muted mb-1">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
        <i className={`${icon} text-3xl`}></i>
      </div>
    </div>
  );
}
