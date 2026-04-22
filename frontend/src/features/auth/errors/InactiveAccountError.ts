export class InactiveAccountError extends Error {
  readonly status = 'INACTIVE';
  readonly email?: string;

  constructor(email?: string) {
    super('Account inactive. Email verification required.');
    this.name = 'InactiveAccountError';
    this.email = email?.trim() || undefined;
  }
}
