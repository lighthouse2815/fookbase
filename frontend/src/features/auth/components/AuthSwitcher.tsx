import { Link } from 'react-router-dom';

interface AuthSwitcherProps {
  prompt: string;
  actionLabel: string;
  to?: string;
  onClick?: () => void;
}

export const AuthSwitcher = ({
  prompt,
  actionLabel,
  to,
  onClick,
}: AuthSwitcherProps) => {
  return (
    <p className="text-center text-sm text-slate-200/75">
      {prompt ? <span>{prompt} </span> : null}
      {to ? (
        <Link className="font-semibold text-white transition hover:text-brand-200" to={to}>
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="font-semibold text-white transition hover:text-brand-200"
        >
          {actionLabel}
        </button>
      )}
    </p>
  );
};
