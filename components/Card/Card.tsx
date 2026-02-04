'use client';

import { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({
  children,
  className = '',
  onClick,
  variant = 'default',
}: CardProps) {
  const classes = [
    styles.card,
    styles[variant],
    onClick && styles.clickable,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick ? () => {
        console.log('Card onClick triggered');
        onClick();
      } : undefined}
    >
      {children}
    </div>
  );
}
