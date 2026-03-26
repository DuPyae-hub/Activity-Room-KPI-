import type { SVGProps } from 'react'

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 16, height: 16, ...props })}>
      <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" />
    </svg>
  )
}

export function IconLogIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 20, height: 20, ...props })}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  )
}

export function IconLogOut(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 18, height: 18, ...props })}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function IconPencil(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 18, height: 18, ...props })}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 18, height: 18, ...props })}>
      <path d="M5 12h14M12 5v14" />
    </svg>
  )
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps({ width: 18, height: 18, ...props })}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  )
}
