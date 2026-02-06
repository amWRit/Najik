import { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './GeneralSelector.module.css';

export interface SelectOption {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
  [key: string]: any; // Allow additional custom properties
}

interface GenericSelectorProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (option: SelectOption) => void;
  loading?: boolean;
  loadingText?: string;
  emptyMessage?: string;
  renderOption?: (option: SelectOption, isSelected: boolean) => ReactNode;
  renderSelected?: (option: SelectOption) => ReactNode;
  disabled?: boolean;
  className?: string;
  error?: string;
}

function GenericSelector({
  label,
  placeholder = 'Select an option...',
  options,
  value,
  onChange,
  loading = false,
  loadingText = 'Loading...',
  emptyMessage = 'No options available',
  renderOption,
  renderSelected,
  disabled = false,
  className = '',
  error,
}: GenericSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option);
    setIsOpen(false);
  };

  const defaultRenderOption = (option: SelectOption, isSelected: boolean) => (
    <>
      <div className={styles.optionInfo}>
        <span className={styles.optionLabel}>{option.label}</span>
        {option.sublabel && (
          <span className={styles.optionSublabel}>{option.sublabel}</span>
        )}
      </div>
      {option.badge && (
        <span className={styles.badge}>{option.badge}</span>
      )}
      {isSelected && (
        <svg className={styles.checkIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </>
  );

  const defaultRenderSelected = (option: SelectOption) => (
    <>
      <span className={styles.selectedLabel}>{option.label}</span>
      {option.sublabel && (
        <span className={styles.selectedSublabel}>({option.sublabel})</span>
      )}
      {option.badge && (
        <span className={styles.badge}>{option.badge}</span>
      )}
    </>
  );

  if (loading) {
    return (
      <div className={`${styles.selectorWrapper} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.loadingState}>{loadingText}</div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={`${styles.selectorWrapper} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.selectorWrapper} ${className}`} ref={dropdownRef}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div className={styles.customSelect}>
        <button
          type="button"
          className={`${styles.selectButton} ${isOpen ? styles.selectButtonOpen : ''} ${error ? styles.selectButtonError : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.selectValue}>
            {selectedOption ? (
              renderSelected ? renderSelected(selectedOption) : defaultRenderSelected(selectedOption)
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </span>
          <svg 
            className={`${styles.selectArrow} ${isOpen ? styles.selectArrowOpen : ''}`}
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none"
          >
            <path 
              d="M5 7.5L10 12.5L15 7.5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {error && <span className={styles.errorText}>{error}</span>}

        {isOpen && (
          <>
            <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
            <div className={styles.dropdown}>
              <div className={styles.dropdownContent} role="listbox">
                {options.map((option) => {
                  const isSelected = option.id === value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      className={`${styles.dropdownItem} ${
                        isSelected ? styles.dropdownItemSelected : ''
                      } ${option.disabled ? styles.dropdownItemDisabled : ''}`}
                      onClick={() => handleSelect(option)}
                    >
                      {renderOption ? renderOption(option, isSelected) : defaultRenderOption(option, isSelected)}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GenericSelector;