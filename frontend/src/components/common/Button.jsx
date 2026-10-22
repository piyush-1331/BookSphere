/**
 * Reusable Button component with Silk neomorphic styling, loading spinner, and icon support.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-semibold rounded-xl select-none cursor-pointer focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm sm:text-base gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-surface text-primary neo-raised hover:neo-pressed-sm active:neo-pressed',
    solid:
      'bg-primary text-white shadow-[4px_4px_10px_rgba(99,102,241,0.3)] hover:bg-primary-container active:scale-[0.98]',
    secondary:
      'bg-surface text-on-surface neo-raised hover:neo-pressed-sm active:neo-pressed',
    outline:
      'bg-surface text-on-surface-variant hover:text-on-surface neo-raised-sm active:neo-pressed-sm',
    ghost:
      'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60',
    danger:
      'bg-surface text-error neo-raised hover:neo-pressed-sm active:neo-pressed',
    success:
      'bg-surface text-emerald-600 neo-raised hover:neo-pressed-sm active:neo-pressed',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="material-symbols-outlined text-[18px] leading-none">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="material-symbols-outlined text-[18px] leading-none">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
