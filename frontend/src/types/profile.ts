export interface Profile {
  id: string;
  username?: string;
  displayName: string;
  fullName?: string;
  avatarUrl: string;
  bio?: string;
  coverUrl?: string;
  friendsCount: number;
  postsCount: number;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  fullNameVisible?: boolean;
  phoneVisible?: boolean;
  emailVisible?: boolean;
  dateOfBirthVisible?: boolean;
  genderVisible?: boolean;
  friendCountVisible?: boolean;
  nickname?: string;
  friendshipStatus?: string;
}

