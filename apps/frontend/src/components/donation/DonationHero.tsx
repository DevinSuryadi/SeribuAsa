import type { LucideIcon } from 'lucide-react'
import { DONATION_ICON_SIZES, DONATION_HERO_VARIANTS } from '@/lib/donation-colors'

interface DonationHeroProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  color?: 'green' | 'emerald'
  iconSize?: 'small' | 'medium' | 'large'
  containerSize?: 'small' | 'medium' | 'large'
}

/**
 * Consistent hero section component used across all donation pages
 * Ensures uniform styling for title, subtitle, and icon
 */
export function DonationHero({
  icon: Icon,
  title,
  subtitle,
  color = 'green',
  iconSize = 'medium',
  containerSize = 'medium',
}: DonationHeroProps) {
  const variant = DONATION_HERO_VARIANTS[color]
  const containerClass = DONATION_ICON_SIZES.container[containerSize]
  const iconClass = DONATION_ICON_SIZES.icon[iconSize]

  return (
    <div className="text-center mb-6">
      {/* Icon Container */}
      <div
        className={`mx-auto mb-4 flex items-center justify-center rounded-full ${containerClass} ${variant.container}`}
      >
        <Icon className={`${iconClass} ${variant.icon}`} />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

      {/* Subtitle */}
      {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
    </div>
  )
}
