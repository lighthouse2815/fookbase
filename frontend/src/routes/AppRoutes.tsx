import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '../layouts/AdminLayout';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { MainLayout } from '../layouts/MainLayout';
import { AdminCommentReportsPage } from '../pages/admin/AdminCommentReportsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminPostReportsPage } from '../pages/admin/AdminPostReportsPage';
import { AdminProfilePage } from '../pages/admin/AdminProfilePage';
import { AdminStoryReportsPage } from '../pages/admin/AdminStoryReportsPage';
import { AdminUserReportsPage } from '../pages/admin/AdminUserReportsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
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
import { CompleteProfilePage } from '../pages/auth/CompleteProfilePage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';

const BloodFortressPage = lazy(() => import('../pages/BloodFortressPage'));

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
            <BloodFortressPage />
          </Suspense>
        }
      />
      <Route
        path="/games/hiep-si-dang-phao-dai-mau/canvas"
        element={<Navigate to="/games/hiep-si-dang-phao-dai-mau" replace />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="reports" element={<Navigate to="/admin/reports/posts" replace />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reports/posts" element={<AdminPostReportsPage />} />
          <Route path="reports/users" element={<AdminUserReportsPage />} />
          <Route path="reports/comments" element={<AdminCommentReportsPage />} />
          <Route path="reports/stories" element={<AdminStoryReportsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

