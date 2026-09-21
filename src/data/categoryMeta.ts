/**
 * Shared visual metadata for calculator category cards.
 * Used on every region index page to render TiltCard-based category sections.
 */
export interface CategoryCardMeta {
  icon: string;
  gradient: string;
  glow: string;
}

export const categoryMeta: Record<string, CategoryCardMeta> = {
  salary: {
    icon: '💰',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
  rent: {
    icon: '🏠',
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  states: {
    icon: '🗺️',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139, 92, 246, 0.2)',
  },
  tax: {
    icon: '🧾',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'rgba(14, 165, 233, 0.2)',
  },
  labor: {
    icon: '⚖️',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
};
