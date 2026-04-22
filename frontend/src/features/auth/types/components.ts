import type { FormEvent, ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export interface AuthFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  loadingLabel?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  children: ReactNode;
  footer: ReactNode;
}

export interface InputFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
  rightElement?: ReactNode;
}
