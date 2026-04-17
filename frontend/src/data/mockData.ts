import type { FriendRequest, FriendSuggestion, FriendUser } from '@/interface/friendship';
import type { NotificationItem } from '@/interface/notification';
import type { Post } from '@/interface/post';
import type { Story } from '@/interface/story';
import type { Profile } from '@/interface/profile';
import type { User } from '@/interface/user';

export const currentUser: User = {
  id: 'u-100',
  username: 'linhpham',
  fullName: 'Linh Pham',
  email: 'linhpham@interacthub.edu',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  isOnline: true,
  faculty: 'Software Engineering',
};

export const profileMock: Profile = {
  id: currentUser.id,
  username: currentUser.username,
  displayName: currentUser.fullName,
  avatarUrl: currentUser.avatarUrl,
  bio: 'Final-year student passionate about web architecture and community products.',
  coverUrl:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  friendsCount: 324,
  postsCount: 61,
};

export const friendSuggestions: FriendSuggestion[] = [
  {
    id: 'u-101',
    username: 'thuha',
    fullName: 'Thu Ha',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    mutualFriends: 18,
    faculty: 'Data Science',
  },
  {
    id: 'u-102',
    username: 'minhvu',
    fullName: 'Minh Vu',
    avatarUrl: 'https://i.pravatar.cc/150?img=33',
    mutualFriends: 11,
    faculty: 'Computer Science',
  },
  {
    id: 'u-103',
    username: 'ngocanh',
    fullName: 'Ngoc Anh',
    avatarUrl: 'https://i.pravatar.cc/150?img=28',
    mutualFriends: 6,
    faculty: 'Information Systems',
  },
];

export const receivedFriendRequestsMock: FriendRequest[] = [
  {
    id: 'u-201',
    requestId: 'fr-001',
    requesterId: 'u-201',
    addresseeId: currentUser.id,
    username: 'huyenkieu',
    fullName: 'Huyen Kieu',
    avatarUrl: 'https://i.pravatar.cc/150?img=49',
    mutualFriends: 9,
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    faculty: 'Business Informatics',
  },
  {
    id: 'u-202',
    requestId: 'fr-002',
    requesterId: 'u-202',
    addresseeId: currentUser.id,
    username: 'ductran',
    fullName: 'Duc Tran',
    avatarUrl: 'https://i.pravatar.cc/150?img=16',
    mutualFriends: 4,
    requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    faculty: 'Software Engineering',
  },
  {
    id: 'u-203',
    requestId: 'fr-003',
    requesterId: 'u-203',
    addresseeId: currentUser.id,
    username: 'thuyduong',
    fullName: 'Thuy Duong',
    avatarUrl: 'https://i.pravatar.cc/150?img=29',
    mutualFriends: 14,
    requestedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    faculty: 'Information Systems',
  },
];

export const sentFriendRequestsMock: FriendRequest[] = [
  {
    id: 'u-204',
    requestId: 'fr-004',
    requesterId: currentUser.id,
    addresseeId: 'u-204',
    username: 'hoanghai',
    fullName: 'Hoang Hai',
    avatarUrl: 'https://i.pravatar.cc/150?img=55',
    mutualFriends: 3,
    requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    faculty: 'Data Science',
  },
  {
    id: 'u-205',
    requestId: 'fr-005',
    requesterId: currentUser.id,
    addresseeId: 'u-205',
    username: 'tamnguyen',
    fullName: 'Tam Nguyen',
    avatarUrl: 'https://i.pravatar.cc/150?img=38',
    mutualFriends: 6,
    requestedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    faculty: 'Computer Science',
  },
];

export const friendsMock: FriendUser[] = [
  {
    id: 'u-301',
    friendshipId: 'f-001',
    username: 'namle',
    fullName: 'Nam Le',
    avatarUrl: 'https://i.pravatar.cc/150?img=60',
    mutualFriends: 23,
    friendsCount: 412,
    faculty: 'Software Engineering',
    bio: 'Coffee, football, and late-night coding sessions.',
    since: '2024-09-18T00:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'u-302',
    friendshipId: 'f-002',
    username: 'hatran',
    fullName: 'Ha Tran',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    mutualFriends: 18,
    friendsCount: 276,
    faculty: 'Information Systems',
    bio: 'UI lover and digital product enthusiast.',
    since: '2025-01-11T00:00:00.000Z',
  },
  {
    id: 'u-303',
    friendshipId: 'f-003',
    username: 'quocthanh',
    fullName: 'Quoc Thanh',
    avatarUrl: 'https://i.pravatar.cc/150?img=36',
    mutualFriends: 31,
    friendsCount: 501,
    faculty: 'Cyber Security',
    bio: 'Sharing study notes and security tips.',
    since: '2023-12-22T00:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'u-304',
    friendshipId: 'f-004',
    username: 'myanh',
    fullName: 'My Anh',
    avatarUrl: 'https://i.pravatar.cc/150?img=65',
    mutualFriends: 15,
    friendsCount: 227,
    faculty: 'Data Science',
    bio: 'Photography and machine learning.',
    since: '2025-03-03T00:00:00.000Z',
  },
];

export const onlineUsers: User[] = [
  {
    id: 'u-104',
    username: 'baoan',
    fullName: 'Bao An',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    isOnline: true,
  },
  {
    id: 'u-105',
    username: 'quocdat',
    fullName: 'Quoc Dat',
    avatarUrl: 'https://i.pravatar.cc/150?img=51',
    isOnline: true,
  },
  {
    id: 'u-106',
    username: 'hoangmai',
    fullName: 'Hoang Mai',
    avatarUrl: 'https://i.pravatar.cc/150?img=41',
    isOnline: true,
  },
];

export const notificationPreview: NotificationItem[] = [
  {
    id: 'n-1',
    message: 'Thu Ha commented on your post.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'n-2',
    message: 'You have a new friend request from Minh Vu.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'n-3',
    message: 'Ngoc Anh shared a study group event.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

export const stories: Story[] = [
  {
    id: 's-1',
    author: friendSuggestions[0],
    imageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 's-2',
    author: friendSuggestions[1],
    imageUrl:
      'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 's-3',
    author: friendSuggestions[2],
    imageUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 's-4',
    author: onlineUsers[0],
    imageUrl:
      'https://images.unsplash.com/photo-1519070994522-9f2297a651a7?auto=format&fit=crop&w=500&q=80',
  },
];

export const posts: Post[] = [
  {
    id: 'p-1',
    author: friendSuggestions[0],
    content:
      'Our UI architecture review went well today. We finalized a clean component structure and service layer for the semester project.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 74,
    reactionCount: 74,
    topReactionTypes: ['LIKE'],
    comments: [
      {
        id: 'c-1',
        author: currentUser,
        content: 'Great progress! Looking forward to the next sprint.',
        createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
        reactionCount: 0,
        topReactionTypes: [],
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1080&q=80',
  },
  {
    id: 'p-2',
    author: friendSuggestions[1],
    content:
      'Anyone interested in a collaborative study session for distributed systems this weekend?',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 31,
    reactionCount: 31,
    topReactionTypes: ['LIKE'],
    comments: [
      {
        id: 'c-2',
        author: friendSuggestions[2],
        content: 'Count me in. Saturday afternoon works best.',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        reactionCount: 0,
        topReactionTypes: [],
      },
      {
        id: 'c-3',
        author: onlineUsers[0],
        content: 'I can bring previous exam materials.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reactionCount: 0,
        topReactionTypes: [],
      },
    ],
  },
  {
    id: 'p-3',
    author: currentUser,
    content:
      'Just published the first version of InteractHub mobile navigation. Tablet and desktop breakpoints are done next.',
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    likes: 92,
    reactionCount: 92,
    topReactionTypes: ['LIKE'],
    comments: [],
  },
  {
    id: 'p-4',
    author: onlineUsers[1],
    content:
      'Campus volunteering program registration opens tomorrow morning. Let me know if you need the link.',
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    likes: 56,
    reactionCount: 56,
    topReactionTypes: ['LIKE'],
    comments: [
      {
        id: 'c-4',
        author: currentUser,
        content: 'Please share it in our class group too.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        reactionCount: 0,
        topReactionTypes: [],
      },
    ],
  },
  {
    id: 'p-5',
    author: onlineUsers[2],
    content:
      'We are preparing a design system workshop for first-year students. Feedback on topics is welcome.',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    likes: 39,
    reactionCount: 39,
    topReactionTypes: ['LIKE'],
    comments: [],
  },
];

