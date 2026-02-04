'use client';

import styles from './StatusIndicator.module.css';

interface StatusIndicatorProps {
  status: 'sharing' | 'offline' | 'sos';
  text: string;
  pulse?: boolean;
}

export default function StatusIndicator({
  status,
  text,
  pulse = false,
}: StatusIndicatorProps) {
  const classes = [
    styles.indicator,
    styles[status],
    pulse && styles.pulse,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <span className={styles.dot} />
      <span className={styles.text}>{text}</span>
    </div>
  );
}
