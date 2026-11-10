export function IconArrowUpRight({ size = 12, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 10 10 2M10 2H4.2M10 2v5.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconArrowLeft({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M12 7H2M2 7l4.2-4.2M2 7l4.2 4.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconArrowRight({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M2 7h10M12 7 7.8 2.8M12 7 7.8 11.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconClose({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconMenu({ size = 12, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M1 3h10M1 9h10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
