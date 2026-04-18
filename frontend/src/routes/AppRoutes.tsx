import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminAuditLogsPage } from '@/pages/admin/AuditLog/AdminAuditLogsPage';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminCommentReportsPage } from '../pages/admin/ReportComment/AdminCommentReportsPage';
import { AdminDashboardPage } from '@/pages/admin/DashBoard/AdminDashboardPage';
import { AdminPostReportsPage } from '@/pages/admin/ReportPost/AdminPostReportsPage';
import { AdminProfilePage } from '@/pages/admin/Profile/AdminProfilePage';
import { AdminStoryReportsPage } from '@/pages/admin/ReportStory/AdminStoryReportsPage';
import { AdminUserReportsPage } from '@/pages/admin/ReportUser/AdminUserReportsPage';
import { AdminUsersPage } from '@/pages/admin/UserManagement/AdminUsersPage';
import { FriendSearchPage } from '@/pages/FriendsPage/FriendSearchPage';
import { FriendsPage } from '@/pages/FriendsPage/FriendsPage';
import { HomePage } from '@/pages/HomePage/HomePage';
import { MessagesPage } from '@/pages/MessagePage/MessagesPage';
import { PersonalInfoSettingsPage } from '@/pages/SettingsPage/PersonalInfoSettingsPage';
import { PostDetailPage } from '@/pages/Post/PostDetailPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { ReportedPostsPage } from '@/pages/SettingsPage/ReportedPostsPage';
import { SavedPostsPage } from '@/pages/Post/SavedPostsPage';
import { SecuritySettingsPage } from '@/pages/SettingsPage/SecuritySettingsPage';
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage';
import { BlockedUsersSettingsPage } from '@/pages/SettingsPage/BlockedUsersSettingsPage';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';
import { CompleteProfilePage } from '@/pages/auth/CompleteProfilePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { GamesPage } from '@/pages/games/GamesPage';
import { ChessPage } from '@/pages/games/ChessPage';
import { CaroPage } from '@/pages/games/CaroPage';
import { SnakeDuoPage } from '@/pages/games/SnakeDuoPage';
import { FlappyDuoPage } from '@/pages/games/FlappyDuoPage';
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

