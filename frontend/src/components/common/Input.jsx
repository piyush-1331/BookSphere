/**
 * Reusable Input component with Silk neomorphic inset styling, label, error display, and icon support.
 */
export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = null,
  helperText = null,
  icon = null,
  required = false,
  disabled = false,
  className = '',
  rows = null,
  ...props
}) => {
  const isTextarea = rows || type === 'textarea';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-error">*</span>}
          </span>
        </label>
      )}

      <div
        className={`relative flex items-center rounded-xl bg-surface neo-pressed-input px-3.5 py-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/40 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${error ? 'ring-2 ring-error/60' : ''}`}
      >
        {icon && (
          <span className="text-outline material-symbols-outlined text-[20px] mr-2.5 select-none pointer-events-none">
            {icon}
          </span>
        )}

        {isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows || 3}
            className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface placeholder:text-outline outline-none resize-y"
            {...props}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface placeholder:text-outline outline-none"
            {...props}
          />
        )}
      </div>

      {error ? (
        <p className="text-xs font-medium text-error flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-on-surface-variant mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
