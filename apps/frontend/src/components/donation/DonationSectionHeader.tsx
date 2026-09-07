import type { ReactNode } from 'react'

interface DonationSectionHeaderProps {
  children: ReactNode
  className?: string
}

/**
 * Consistent section header component for donation pages
 * Ensures uniform heading styles across all donation-related sections
 */
export function DonationSectionHeader({
  children,
  className = '',
}: DonationSectionHeaderProps) {
  return (
    <h3 className={`text-sm font-semibold text-gray-700 uppercase tracking-wide ${className}`}>
      {children}
    </h3>
  )
}
