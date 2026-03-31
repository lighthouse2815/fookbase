import { Save, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { profileService, type MyProfileSettings, type UpdateMyProfileRequest } from '../services/profileService';
import { getApiErrorMessage } from '../utils/apiError';

interface FormState {
  displayName: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: string;
  avatarUrl: string;
}

const EMPTY_FORM: FormState = {
  displayName: '',
  firstName: '',
  lastName: '',
  birthday: '',
  gender: '',
  avatarUrl: '',
};

const normalizeGender = (value?: string | null): string => value?.trim().toUpperCase() ?? '';

export const PersonalInfoSettingsPage = () => {
  const [profile, setProfile] = useState<MyProfileSettings | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadMyProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await profileService.getMyProfileSettings();
        if (isCancelled) {
          return;
        }

        setProfile(data);
        setForm({
          displayName: data.displayName ?? '',
          firstName: '',
          lastName: '',
          birthday: data.birthDate ?? '',
          gender: normalizeGender(data.gender),
          avatarUrl: data.avatarUrl ?? '',
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(getApiErrorMessage(error, 'Khong the tai thong tin ca nhan.'));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMyProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: UpdateMyProfileRequest = {
      displayName: form.displayName.trim() || undefined,
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      birthday: form.birthday.trim() || undefined,
      gender: form.gender.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
    };

    try {
      await profileService.updateMyProfile(payload);

      const refreshed = await profileService.getMyProfileSettings();
      setProfile(refreshed);
      setForm((previous) => ({
        ...previous,
        displayName: refreshed.displayName ?? previous.displayName,
        birthday: refreshed.birthDate ?? previous.birthday,
        gender: normalizeGender(refreshed.gender) || previous.gender,
        avatarUrl: refreshed.avatarUrl ?? previous.avatarUrl,
      }));
      setSuccessMessage('Cap nhat thong tin thanh cong.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Khong the cap nhat thong tin ca nhan.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
        Dang tai thong tin ca nhan...
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <UserRound size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Thong tin ca nhan</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Xem va cap nhat cac thong tin profile cua ban.
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-xl border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Username
            <input
              value={profile?.username ?? ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input
              value={profile?.email ?? ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            So dien thoai
            <input
              value={profile?.phoneNumber ?? ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Display name
            <input
              value={form.displayName}
              onChange={(event) => handleFieldChange('displayName', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Nhap ten hien thi"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            First name
            <input
              value={form.firstName}
              onChange={(event) => handleFieldChange('firstName', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Nhap ten"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Last name
            <input
              value={form.lastName}
              onChange={(event) => handleFieldChange('lastName', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Nhap ho"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Ngay sinh
            <input
              type="date"
              value={form.birthday}
              onChange={(event) => handleFieldChange('birthday', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Gioi tinh
            <select
              value={form.gender}
              onChange={(event) => handleFieldChange('gender', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Chon gioi tinh</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nu</option>
              <option value="OTHER">Khac</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Avatar URL
          <input
            value={form.avatarUrl}
            onChange={(event) => handleFieldChange('avatarUrl', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="https://..."
          />
        </label>

        {form.avatarUrl ? (
          <div className="mt-3">
            <img src={form.avatarUrl} alt="Avatar preview" className="h-20 w-20 rounded-2xl object-cover" />
          </div>
        ) : null}

        <div className="mt-5">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? 'Dang luu...' : 'Luu thay doi'}
          </button>
        </div>
      </section>
    </div>
  );
};
