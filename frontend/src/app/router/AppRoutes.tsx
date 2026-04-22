import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '@/features/admin/ui/layout/AdminLayout';
import { MainLayout } from '@/app/layouts/MainLayout';
import { AdminAuditLogsPage } from '@/features/admin/pages/AdminAuditLogsPage';
import { AdminCommentReportsPage } from '@/features/admin/pages/AdminCommentReportsPage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminPostReportsPage } from '@/features/admin/pages/AdminPostReportsPage';
import { AdminProfilePage } from '@/features/admin/pages/AdminProfilePage';
import { AdminStoryReportsPage } from '@/features/admin/pages/AdminStoryReportsPage';
import { AdminUserReportsPage } from '@/features/admin/pages/AdminUserReportsPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { FriendSearchPage } from '@/features/friendship/pages/FriendSearchPage';
import { FriendsPage } from '@/features/friendship/pages/FriendsPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { MessagesPage } from '@/features/message/pages/MessagesPage';
import { PersonalInfoSettingsPage } from '@/features/settings/pages/PersonalInfoSettingsPage';
import { PostDetailPage } from '@/features/post/pages/PostDetailPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ReportedPostsPage } from '@/features/settings/pages/ReportedPostsPage';
import { SavedPostsPage } from '@/features/post/pages/SavedPostsPage';
import { SecuritySettingsPage } from '@/features/settings/pages/SecuritySettingsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { BlockedUsersSettingsPage } from '@/features/settings/pages/BlockedUsersSettingsPage';
import { AdminLoginPage } from '@/features/auth/pages/AdminLoginPage';
import { CompleteProfilePage } from '@/features/auth/pages/CompleteProfilePage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { GamesPage } from '@/features/games/pages/GamesPage';
import { ChessPage } from '@/features/games/pages/ChessPage';
import { CaroPage } from '@/features/games/pages/CaroPage';
import { SnakeDuoPage } from '@/features/games/pages/SnakeDuoPage';
import { FlappyDuoPage } from '@/features/games/pages/FlappyDuoPage';
import { AdminRoute } from './guards/AdminRoute';
import { ProtectedRoute } from './guards/ProtectedRoute';

const BloodFortressPage = lazy(() => import('@/features/bloodFortress/pages/BloodFortressPage'));

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
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/chess" element={<ChessPage />} />
          <Route path="/games/caro" element={<CaroPage />} />
          <Route path="/games/tictactoe" element={<Navigate to="/games/caro" replace />} />
          <Route path="/games/snake-duo" element={<SnakeDuoPage />} />
          <Route path="/games/flappy-duo" element={<FlappyDuoPage />} />
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




