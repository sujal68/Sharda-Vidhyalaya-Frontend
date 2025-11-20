export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield */}
      <path d="M50 5 L85 20 L85 50 Q85 75 50 95 Q15 75 15 50 L15 20 Z" 
            fill="currentColor" className="text-sky-500 dark:text-blue-700" opacity="0.2"/>
      <path d="M50 5 L85 20 L85 50 Q85 75 50 95 Q15 75 15 50 L15 20 Z" 
            stroke="currentColor" className="text-sky-500 dark:text-blue-700" strokeWidth="2" fill="none"/>
      
      {/* Book */}
      <rect x="35" y="35" width="30" height="35" rx="2" 
            fill="currentColor" className="text-sky-600 dark:text-blue-600"/>
      <line x1="50" y1="35" x2="50" y2="70" 
            stroke="white" strokeWidth="1.5"/>
      <line x1="35" y1="45" x2="65" y2="45" 
            stroke="white" strokeWidth="1" opacity="0.5"/>
      <line x1="35" y1="55" x2="65" y2="55" 
            stroke="white" strokeWidth="1" opacity="0.5"/>
      
      {/* Laurel Left */}
      <path d="M25 45 Q20 50 25 55 Q22 52 20 50 Q22 48 25 45" 
            fill="currentColor" className="text-green-600 dark:text-green-500"/>
      
      {/* Laurel Right */}
      <path d="M75 45 Q80 50 75 55 Q78 52 80 50 Q78 48 75 45" 
            fill="currentColor" className="text-green-600 dark:text-green-500"/>
    </svg>
  );
}
