export class BannedAccountError extends Error {
  readonly status = 'BANNED';

  constructor(message = 'Account is banned.') {
    super(message);
    this.name = 'BannedAccountError';
  }
}
