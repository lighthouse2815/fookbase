export type AdminUserStatusRequest = 'ACTIVE' | 'BANNED' | 'INACTIVE';
export type AdminResolveReportStatusRequest = 'RESOLVED' | 'REJECTED';
export type AdminReportStatusRequest = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface UpdateAdminUserStatusRequestDto {
  status: AdminUserStatusRequest;
}

export interface CreatePostReportRequestDto {
  postId: string;
  reason: string;
}

export interface ResolvePostReportRequestDto {
  status: AdminReportStatusRequest;
}

export interface CreateUserReportRequestDto {
  targetUserId: string;
  reason: string;
}

export interface ResolveUserReportRequestDto {
  status: AdminResolveReportStatusRequest;
}

export interface CreateStoryReportRequestDto {
  storyId: string;
  reason: string;
}

export interface ResolveStoryReportRequestDto {
  status: AdminResolveReportStatusRequest;
}

export type UpdateAdminUserStatusRequest = UpdateAdminUserStatusRequestDto;
export type CreatePostReportRequest = CreatePostReportRequestDto;
export type ResolvePostReportRequest = ResolvePostReportRequestDto;
export type CreateUserReportRequest = CreateUserReportRequestDto;
export type ResolveUserReportRequest = ResolveUserReportRequestDto;
export type CreateStoryReportRequest = CreateStoryReportRequestDto;
export type ResolveStoryReportRequest = ResolveStoryReportRequestDto;
