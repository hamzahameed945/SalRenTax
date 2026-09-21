import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

interface TiltCardProps {
  href: string;
  children: JSX.Element | JSX.Element[];
  class?: string;
  glowColor?: string;
}

/**
 * Interactive card that responds to mouse movement with a 3D tilt and glow.
 * Wraps an <a> tag so clicking navigates to the target page.
 */
export default function TiltCard({
  href,
  children,
  class: className = '',
  glowColor = 'rgba(15, 110, 91, 0.15)',
}: TiltCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [style, setStyle] = useState<Record<string, string>>({
    transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
    transition: 'transform 0.15s ease-out',
  });
  const [glowStyle, setGlowStyle] = useState<Record<string, string>>({
    opacity: '0',
  });

  const handleMouseMove = (e: MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: 'transform 0.1s ease-out',
    });

    setGlowStyle({
      opacity: '1',
      background: `radial-gradient(circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.4s ease-out',
    });
    setGlowStyle({ opacity: '0' });
  };

  return (
    <a
      ref={cardRef}
      href={href}
      class={`relative block overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer no-underline ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow overlay */}
      <div
        class="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={glowStyle}
      />
      {/* Content */}
      <div class="relative z-10">
        {children}
      </div>
    </a>
  );
}
