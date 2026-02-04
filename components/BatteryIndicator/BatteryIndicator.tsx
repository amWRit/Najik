'use client';

import styles from './BatteryIndicator.module.css';

interface BatteryIndicatorProps {
  level: number; // 0-100
  size?: 'small' | 'medium' | 'large';
}

export default function BatteryIndicator({
  level,
  size = 'medium',
}: BatteryIndicatorProps) {
  const getStatus = () => {
    if (level > 50) return 'high';
    if (level > 20) return 'medium';
    return 'low';
  };

  const status = getStatus();

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={`${styles.battery} ${styles[status]}`}>
        <div className={styles.batteryBody}>
          <div
            className={styles.batteryLevel}
            style={{ width: `${level}%` }}
          />
        </div>
        <div className={styles.batteryTip} />
      </div>
      <span className={styles.text}>{level}%</span>
    </div>
  );
}
