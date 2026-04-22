import { API_ENDPOINTS } from '@/shared/api/endpoints';

import type {
  BlockedUser,
  FriendRequest,
  FriendSuggestion,
  Friendship,
  FriendUser,
} from '@/features/friendship/types/contracts';
import type {
  BlockUserRequestDto,
  CancelFriendRequestRequestDto,
  FriendshipRequestActionRequestDto,
  LegacyReportUserRequestDto,
  ReportUserRequestDto,
  SendFriendRequestFallbackRequestDto,
  SendFriendRequestRequestDto,
  UnfriendRequestDto,
} from '@/features/friendship/api/dtos/request.dto';
import type {
  BlockedUserResponseDto,
  ContactResponseDto,
  JavaFriendshipResponseDto,
} from '@/features/friendship/api/dtos/response.dto';
import {
  mapBlockedUserResponseDtoToBlockedUser,
  mapContactResponseDtoToFriendUser,
  mapPendingRequesterResponseDtoToFriendRequest,
  mapSendFriendRequestResponseToFriendship,
  normalizeFriendRequestTimestamps,
  sortFriendRequestsByLatestUpdate,
} from '@/features/friendship/api/mapper/mapper';
import { getPendingRequestersFromJava, requestFromCandidates } from '@/features/friendship/utils/friendshipApi.util';

const FW = API_ENDPOINTS.FRIENDSHIPS;
const PROFILE = API_ENDPOINTS.PROFILES;
const USER_REPORTS = API_ENDPOINTS.USER_REPORTS;

export const friendshipService = {
  async getFriendSuggestions(): Promise<FriendSuggestion[]> {
    return requestFromCandidates<FriendSuggestion[]>([
      { method: 'get', path: FW.SUGGESTIONS },
      { method: 'get', path: FW.FRIENDS_SUGGESTIONS },
    ]);
  },

  async getReceivedRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return sortFriendRequestsByLatestUpdate(
        pending
          .filter((item) => item.requester !== true)
          .map((item, index) => mapPendingRequesterResponseDtoToFriendRequest(item, index, 'received')),
      );
    } catch {
      const requests = await requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: FW.REQUESTS_RECEIVED },
        { method: 'get', path: FW.RECEIVED },
        { method: 'get', path: FW.FRIENDS_REQUESTS_RECEIVED },
      ]);
      return sortFriendRequestsByLatestUpdate(requests.map(normalizeFriendRequestTimestamps));
    }
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return sortFriendRequestsByLatestUpdate(
        pending
          .filter((item) => item.requester === true)
          .map((item, index) => mapPendingRequesterResponseDtoToFriendRequest(item, index, 'sent')),
      );
    } catch {
      const requests = await requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: FW.REQUESTS_SENT },
        { method: 'get', path: FW.SENT },
        { method: 'get', path: FW.FRIENDS_REQUESTS_SENT },
      ]);
      return sortFriendRequestsByLatestUpdate(requests.map(normalizeFriendRequestTimestamps));
    }
  },

  async getFriends(): Promise<FriendUser[]> {
    try {
      const contacts = await requestFromCandidates<ContactResponseDto[]>([{ method: 'get', path: FW.CONTACTS }]);
      return contacts.map(mapContactResponseDtoToFriendUser);
    } catch {
      return requestFromCandidates<FriendUser[]>([
        { method: 'get', path: FW.FRIENDS_LIST },
        { method: 'get', path: FW.FRIENDS_ROOT },
      ]);
    }
  },

  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const primaryRequestDto: SendFriendRequestRequestDto = {
      addresseeId,
      userId: addresseeId,
    };
    const fallbackRequestDto: SendFriendRequestFallbackRequestDto = {
      addresseeId,
    };

    const payload = await requestFromCandidates<JavaFriendshipResponseDto | Friendship>([
      {
        method: 'post',
        path: FW.REQUEST,
        data: primaryRequestDto,
      },
      {
        method: 'post',
        path: FW.FRIENDS_REQUEST,
        data: fallbackRequestDto,
      },
    ]);

    return mapSendFriendRequestResponseToFriendship(payload, addresseeId);
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    const requestActionDto: FriendshipRequestActionRequestDto = { requestId, userId: requestId };

    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.ACCEPT, data: requestActionDto },
      { method: 'post', path: FW.ACCEPT_BY_REQUEST_ID(requestId) },
      { method: 'post', path: FW.ACCEPT_BY_ID(requestId) },
    ]);
  },

  async deleteFriendRequest(requestId: string): Promise<void> {
    const requestActionDto: FriendshipRequestActionRequestDto = { requestId, userId: requestId };

    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.REJECT, data: requestActionDto },
      { method: 'delete', path: FW.REQUEST_BY_ID(requestId) },
      { method: 'delete', path: FW.BY_ID(requestId) },
    ]);
  },

  async cancelSentRequest(requestId: string): Promise<void> {
    const requestActionDto: FriendshipRequestActionRequestDto = { requestId, userId: requestId };
    const cancelRequestDto: CancelFriendRequestRequestDto = { requestId };

    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.REJECT, data: requestActionDto },
      { method: 'delete', path: FW.CANCEL_REQUEST(requestId) },
      { method: 'delete', path: FW.REQUEST_BY_ID(requestId) },
      { method: 'post', path: FW.CANCEL, data: cancelRequestDto },
    ]);
  },

  async unfriend(friendId: string): Promise<void> {
    const unfriendRequestDto: UnfriendRequestDto = { friendId, userId: friendId };

    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.UNFRIEND, data: unfriendRequestDto },
      { method: 'delete', path: FW.FRIENDS_BY_ID(friendId) },
      { method: 'delete', path: FW.FRIEND_BY_ID(friendId) },
    ]);
  },

  async blockUser(targetUserId: string): Promise<void> {
    const blockRequestDto: BlockUserRequestDto = { userId: targetUserId, targetUserId };

    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.BLOCK, data: blockRequestDto },
      { method: 'post', path: FW.BLOCK_BY_ID(targetUserId) },
      { method: 'post', path: FW.JAVA_BLOCK_BY_ID(targetUserId), client: 'java' },
    ]);
  },

  async getBlockedUsers(): Promise<BlockedUser[]> {
    const blockedUsers = await requestFromCandidates<BlockedUserResponseDto[]>([
      { method: 'get', path: FW.BLOCKED_USERS },
      { method: 'get', path: FW.JAVA_BLOCKED_USERS, client: 'java' },
    ]);

    return blockedUsers.map(mapBlockedUserResponseDtoToBlockedUser);
  },

  async unblockUser(targetUserId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'delete', path: FW.BLOCK_BY_ID(targetUserId) },
      { method: 'delete', path: FW.JAVA_BLOCK_BY_ID(targetUserId), client: 'java' },
    ]);
  },

  async reportUser(targetUserId: string, reason: string): Promise<void> {
    const reportRequestDto: ReportUserRequestDto = { targetUserId, reason };
    const legacyReportRequestDto: LegacyReportUserRequestDto = {
      userId: targetUserId,
      targetUserId,
      reason,
    };

    await requestFromCandidates<unknown>([
      { method: 'post', path: USER_REPORTS.CREATE, data: reportRequestDto },
      { method: 'post', path: USER_REPORTS.LEGACY_CREATE, data: legacyReportRequestDto },
      { method: 'post', path: PROFILE.REPORT_BY_ID(targetUserId), data: { reason } },
      { method: 'post', path: USER_REPORTS.JAVA_CREATE, data: reportRequestDto, client: 'java' },
    ]);
  },
};
