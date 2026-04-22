import { Eye, EyeOff } from 'lucide-react';

import type { SecurityFieldKey } from '@/features/settings/types/pages';
import type { UseSecuritySettingsReturn } from '@/features/settings/types/hooks';

interface SecurityAccountFieldCardProps {
  t: UseSecuritySettingsReturn['t'];
  label: string;
  value: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onEdit?: () => void;
  isEditDisabled?: boolean;
  isSending?: boolean;
  isEditAvailable?: boolean;
  editDisabledTitle?: string;
}

type SecurityAccountInfoSectionProps = Pick<
  UseSecuritySettingsReturn,
  | 't'
  | 'securityUsername'
  | 'securityEmail'
  | 'securityPhoneNumber'
  | 'showSecurityUsername'
  | 'setShowSecurityUsername'
  | 'showSecurityEmail'
  | 'setShowSecurityEmail'
  | 'showSecurityPhoneNumber'
  | 'setShowSecurityPhoneNumber'
  | 'isLoadingSecurityUsername'
  | 'securityUsernameError'
  | 'isSendingEditOtp'
  | 'editingField'
  | 'activeEditField'
  | 'activeEditStep'
  | 'editOtp'
  | 'setEditOtp'
  | 'editValue'
  | 'setEditValue'
  | 'isVerifyingEditOtp'
  | 'isUpdatingEditField'
  | 'editOtpInfoMessage'
  | 'editOtpErrorMessage'
  | 'resolveSensitiveValue'
  | 'getFieldLabel'
  | 'resetEditFlow'
  | 'handleSendEditOtp'
  | 'handleVerifyEditOtp'
  | 'handleUpdateEditField'
>;

const SecurityAccountFieldCard = ({
  t,
  label,
  value,
  isVisible,
  onToggleVisibility,
  onEdit,
  isEditDisabled,
  isSending,
  isEditAvailable = true,
  editDisabledTitle,
}: SecurityAccountFieldCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={isVisible ? t('auth.hidePassword') : t('auth.showPassword')}
            title={isVisible ? t('auth.hidePassword') : t('auth.showPassword')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          {isEditAvailable ? (
            <button
              type="button"
              onClick={onEdit}
              disabled={isEditDisabled}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? t('securitySettings.sendingButton') : t('personalInfoSettings.editButton')}
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={editDisabledTitle}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
            >
              {t('personalInfoSettings.editButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const buildEditFieldPlaceholder = (
  activeEditField: SecurityFieldKey,
  t: UseSecuritySettingsReturn['t'],
) => {
  if (activeEditField === 'username') {
    return t('securitySettings.newUsernamePlaceholder');
  }

  return t('securitySettings.newPhoneNumberPlaceholder');
};

export const SecurityAccountInfoSection = ({
  t,
  securityUsername,
  securityEmail,
  securityPhoneNumber,
  showSecurityUsername,
  setShowSecurityUsername,
  showSecurityEmail,
  setShowSecurityEmail,
  showSecurityPhoneNumber,
  setShowSecurityPhoneNumber,
  isLoadingSecurityUsername,
  securityUsernameError,
  isSendingEditOtp,
  editingField,
  activeEditField,
  activeEditStep,
  editOtp,
  setEditOtp,
  editValue,
  setEditValue,
  isVerifyingEditOtp,
  isUpdatingEditField,
  editOtpInfoMessage,
  editOtpErrorMessage,
  resolveSensitiveValue,
  getFieldLabel,
  resetEditFlow,
  handleSendEditOtp,
  handleVerifyEditOtp,
  handleUpdateEditField,
}: SecurityAccountInfoSectionProps) => {
  const isEditActionDisabled =
    isLoadingSecurityUsername || isSendingEditOtp || isVerifyingEditOtp || isUpdatingEditField;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('securitySettings.accountInfoTitle')}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t('securitySettings.accountInfoOtpHint')}
      </p>

      <div className="mt-3 space-y-3">
        <SecurityAccountFieldCard
          t={t}
          label={t('securitySettings.usernameLabel')}
          value={
            isLoadingSecurityUsername
              ? t('common.loading')
              : resolveSensitiveValue(securityUsername, showSecurityUsername, { prefix: '@' })
          }
          isVisible={showSecurityUsername}
          onToggleVisibility={() => setShowSecurityUsername((value) => !value)}
          onEdit={() => void handleSendEditOtp('username')}
          isEditDisabled={isEditActionDisabled}
          isSending={isSendingEditOtp && editingField === 'username'}
        />

        <SecurityAccountFieldCard
          t={t}
          label={t('securitySettings.emailLabel')}
          value={
            isLoadingSecurityUsername
              ? t('common.loading')
              : resolveSensitiveValue(securityEmail, showSecurityEmail)
          }
          isVisible={showSecurityEmail}
          onToggleVisibility={() => setShowSecurityEmail((value) => !value)}
          isEditAvailable={false}
          editDisabledTitle={t('securitySettings.emailEditDisabledHint')}
        />

        <SecurityAccountFieldCard
          t={t}
          label={t('securitySettings.phoneNumberLabel')}
          value={
            isLoadingSecurityUsername
              ? t('common.loading')
              : resolveSensitiveValue(securityPhoneNumber, showSecurityPhoneNumber)
          }
          isVisible={showSecurityPhoneNumber}
          onToggleVisibility={() => setShowSecurityPhoneNumber((value) => !value)}
          onEdit={() => void handleSendEditOtp('phoneNumber')}
          isEditDisabled={isEditActionDisabled}
          isSending={isSendingEditOtp && editingField === 'phoneNumber'}
        />
      </div>

      {activeEditField && activeEditStep ? (
        <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/40 dark:bg-brand-500/10">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            {t('securitySettings.editFieldTitle', { field: getFieldLabel(activeEditField) })}
          </p>

          {activeEditStep === 'verifyOtp' ? (
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('securitySettings.otpLabel')}
                <input
                  value={editOtp}
                  onChange={(event) => setEditOtp(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder={t('securitySettings.otpPlaceholder')}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleVerifyEditOtp()}
                  disabled={isVerifyingEditOtp || isUpdatingEditField}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isVerifyingEditOtp
                    ? t('securitySettings.verifyingButton')
                    : t('securitySettings.verifyOtpButton')}
                </button>

                <button
                  type="button"
                  onClick={() => void handleSendEditOtp(activeEditField)}
                  disabled={isSendingEditOtp || isVerifyingEditOtp || isUpdatingEditField}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t('securitySettings.resendOtpButton')}
                </button>

                <button
                  type="button"
                  onClick={resetEditFlow}
                  disabled={isSendingEditOtp || isVerifyingEditOtp || isUpdatingEditField}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t('securitySettings.cancelButton')}
                </button>
              </div>
            </div>
          ) : null}

          {activeEditStep === 'edit' ? (
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {getFieldLabel(activeEditField)}
                <input
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder={buildEditFieldPlaceholder(activeEditField, t)}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleUpdateEditField()}
                  disabled={isUpdatingEditField || isVerifyingEditOtp}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUpdatingEditField
                    ? t('securitySettings.updatingButton')
                    : t('securitySettings.updateFieldButton')}
                </button>

                <button
                  type="button"
                  onClick={resetEditFlow}
                  disabled={isUpdatingEditField || isVerifyingEditOtp}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t('securitySettings.cancelButton')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {editOtpErrorMessage ? (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{editOtpErrorMessage}</p>
      ) : null}

      {editOtpInfoMessage ? (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{editOtpInfoMessage}</p>
      ) : null}

      {securityUsernameError ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{securityUsernameError}</p>
      ) : null}
    </section>
  );
};
