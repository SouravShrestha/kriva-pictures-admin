import type { SVGProps } from "react";

/**
 * Minimal hand-rolled icon set (stroke-based, 1.75px, 24x24 viewbox) so we don't
 * need to pull in an icon library dependency. Mirrors the lucide icon style.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const IconGrid = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconImage = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5-9 9" />
  </svg>
);

export const IconLayout = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

export const IconMessage = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const IconPackage = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21 8v8a2 2 0 0 1-1 1.73l-6 3.46a2 2 0 0 1-2 0l-6-3.46A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l6-3.46a2 2 0 0 1 2 0l6 3.46A2 2 0 0 1 21 8Z" />
    <path d="M3.27 6.96 12 12l8.73-5.04" />
    <path d="M12 22.08V12" />
  </svg>
);

export const IconHelp = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.29c-.71.32-1 .8-1 1.71" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconFolder = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 4h6l2 3h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
  </svg>
);

export const IconRocket = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 19 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

export const IconLogout = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const IconExternalLink = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
);

export const IconPlus = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const IconTrash = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

export const IconPencil = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export const IconChevronDown = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconX = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

export const IconUpload = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
);

export const IconCheck = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconMenu = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

export const IconChevronRight = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const IconArrowUp = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

export const IconArrowDown = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14" />
    <path d="M19 12l-7 7-7-7" />
  </svg>
);

export const IconStar = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3l2.9 5.9 6.1.9-4.4 4.3 1 6.1-5.6-3-5.6 3 1-6.1L3 9.8l6.1-.9Z" />
  </svg>
);
