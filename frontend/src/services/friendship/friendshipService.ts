import { API_CONFIG } from '@/config/apiConfig';

import type {
  ContactPayload,
  FriendRequest,
  FriendSuggestion,
  Friendship,
  FriendUser,
  JavaFriendshipPayload,
} from '@/interface/friendship';
import {
  getPendingRequestersFromJava,
  mapContactToFriend,
  mapJavaFriendship,
  mapPendingRequesterToRequest,
  requestFromCandidates,
  isFriendshipPayloadRecord,
} from '@/services/friendship/util';

const FW = API_CONFIG.ENDPOINTS.FRIENDSHIPS;

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
      return pending
        .filter((item) => item.requester !== true)
        .map((item, index) => mapPendingRequesterToRequest(item, index, 'received'));
    } catch {
      return requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: FW.REQUESTS_RECEIVED },
        { method: 'get', path: FW.RECEIVED },
        { method: 'get', path: FW.FRIENDS_REQUESTS_RECEIVED },
      ]);
    }
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return pending
        .filter((item) => item.requester === true)
        .map((item, index) => mapPendingRequesterToRequest(item, index, 'sent'));
    } catch {
      return requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: FW.REQUESTS_SENT },
        { method: 'get', path: FW.SENT },
        { method: 'get', path: FW.FRIENDS_REQUESTS_SENT },
      ]);
    }
  },

  async getFriends(): Promise<FriendUser[]> {
    try {
      const contacts = await requestFromCandidates<ContactPayload[]>([
        { method: 'get', path: FW.CONTACTS },
      ]);
      return contacts.map(mapContactToFriend);
    } catch {
      return requestFromCandidates<FriendUser[]>([
        { method: 'get', path: FW.FRIENDS_LIST },
        { method: 'get', path: FW.FRIENDS_ROOT },
      ]);
    }
  },

  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const payload = await requestFromCandidates<JavaFriendshipPayload | Friendship>([
      {
        method: 'post',
        path: FW.REQUEST,
        data: { addresseeId, userId: addresseeId },
      },
      {
        method: 'post',
        path: FW.FRIENDS_REQUEST,
        data: { addresseeId },
      },
    ]);

    if (isFriendshipPayloadRecord(payload)) {
      return mapJavaFriendship(payload as JavaFriendshipPayload, addresseeId);
    }

    return {
      id: `friendship-${addresseeId}-${Date.now()}`,
      requesterId: 'me',
      addresseeId,
      status: 'pending',
    };
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.ACCEPT, data: { requestId, userId: requestId } },
      { method: 'post', path: FW.ACCEPT_BY_REQUEST_ID(requestId) },
      { method: 'post', path: FW.ACCEPT_BY_ID(requestId) },
    ]);
  },

  async deleteFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.REJECT, data: { requestId, userId: requestId } },
      { method: 'delete', path: FW.REQUEST_BY_ID(requestId) },
      { method: 'delete', path: FW.BY_ID(requestId) },
    ]);
  },

  async cancelSentRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.REJECT, data: { requestId, userId: requestId } },
      { method: 'delete', path: FW.CANCEL_REQUEST(requestId) },
      { method: 'delete', path: FW.REQUEST_BY_ID(requestId) },
      { method: 'post', path: FW.CANCEL, data: { requestId } },
    ]);
  },

  async unfriend(friendId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.UNFRIEND, data: { friendId, userId: friendId } },
      { method: 'delete', path: FW.FRIENDS_BY_ID(friendId) },
      { method: 'delete', path: FW.FRIEND_BY_ID(friendId) },
    ]);
  },
};
