import Image from 'next/image';

export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <Image 
      src="/logo.PNG" 
      alt="Sharda Vidhyalaya Logo" 
      width={48} 
      height={48} 
      className={className}
      priority
    />
  );
}
