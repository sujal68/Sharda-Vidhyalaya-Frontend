import Image from 'next/image';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative ${className} flex-shrink-0`}>
      <Image
        src="/logo.png"
        alt="Sharda Vidhyalaya Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
