import { lazy, Suspense } from 'react';
import { AdminReportsPage } from '../pages/AdminReportsPage';
import { Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from '../layouts/MainLayout';
import { FriendSearchPage } from '../pages/FriendSearchPage';
import { FriendsPage } from '../pages/FriendsPage';
import { HomePage } from '../pages/HomePage';
import { MessagesPage } from '../pages/MessagesPage';
import { PersonalInfoSettingsPage } from '../pages/PersonalInfoSettingsPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ReportedPostsPage } from '../pages/ReportedPostsPage';
import { SavedPostsPage } from '../pages/SavedPostsPage';
import { SecuritySettingsPage } from '../pages/SecuritySettingsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { BlockedUsersSettingsPage } from '../pages/BlockedUsersSettingsPage';
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';

const BloodFortressPage = lazy(() => import('../pages/BloodFortressPage'));
const BloodFortressUnityPage = lazy(() => import('../pages/BloodFortressUnityPage'));

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/games/hiep-si-dang-phao-dai-mau"
        element={
          <Suspense fallback={<div className="min-h-screen bg-black text-white" />}>
            <BloodFortressUnityPage />
          </Suspense>
        }
      />
      <Route
        path="/games/hiep-si-dang-phao-dai-mau/canvas"
        element={
          <Suspense fallback={<div className="min-h-screen bg-black text-white" />}>
            <BloodFortressPage />
          </Suspense>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/search" element={<FriendSearchPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} />
          <Route path="/saved" element={<SavedPostsPage />} />
          <Route path="/reports" element={<ReportedPostsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/security" element={<SecuritySettingsPage />} />
          <Route path="/settings/personal-info" element={<PersonalInfoSettingsPage />} />
          <Route path="/settings/blocked" element={<BlockedUsersSettingsPage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

