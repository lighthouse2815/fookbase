import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import { PostCard } from '../components/PostCard';
import { ProfileHeader } from '../components/ProfileHeader';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { postService } from '../services/postService';
import { profileService } from '../services/profileService';
import type { Post } from '../types/post';
import type { Profile } from '../types/profile';

const DEFAULT_PROFILE = (user: MainLayoutOutletContext['currentUser']): Profile => ({
  ...user,
  bio: '',
  coverUrl: undefined,
  major: user.faculty ?? '',
  year: '',
  friendsCount: 0,
  postsCount: 0,
});

const DEFAULT_PUBLIC_USERNAME = 'user';
const DEFAULT_PUBLIC_FULL_NAME = 'User';

const createFallbackProfile = (
  targetUserId: string,
  currentUser: MainLayoutOutletContext['currentUser'],
): Profile => {
  if (targetUserId === currentUser.id) {
    return DEFAULT_PROFILE(currentUser);
  }

  return {
    ...DEFAULT_PROFILE(currentUser),
    id: targetUserId,
    username: DEFAULT_PUBLIC_USERNAME,
    fullName: DEFAULT_PUBLIC_FULL_NAME,
    email: undefined,
    avatarUrl: `https://i.pravatar.cc/150?u=${targetUserId}`,
  };
};

const PROFILE_POSTS_PAGE_SIZE = 100;

export const ProfilePage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const { userId } = useParams<{ userId: string }>();
  const targetUserId = userId ?? currentUser.id;
  const [profile, setProfile] = useState<Profile>(() => createFallbackProfile(targetUserId, currentUser));
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);

  useEffect(() => {
    setProfile(createFallbackProfile(targetUserId, currentUser));

    const loadProfile = async () => {
      try {
        const data = await profileService.getProfileById(targetUserId);
        setProfile((previous) => ({
          ...previous,
          ...data,
          bio: data.bio ?? previous.bio,
          coverUrl: data.coverUrl ?? previous.coverUrl,
          major: data.major ?? previous.major,
          year: data.year ?? previous.year,
        }));
      } catch {
        if (targetUserId === currentUser.id) {
          setProfile((previous) => ({
            ...previous,
            id: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName,
            email: currentUser.email,
            avatarUrl: currentUser.avatarUrl,
          }));
        }
      }
    };

    void loadProfile();
  }, [currentUser, targetUserId]);

  useEffect(() => {
    const loadPersonalPosts = async () => {
      try {
        const response = await postService.getPosts(1, PROFILE_POSTS_PAGE_SIZE);
        const items = response.items.filter((post) => post.author.id === targetUserId);
        setPersonalPosts(items);
        setProfile((previous) => ({
          ...previous,
          postsCount: items.length,
        }));
      } catch {
        setPersonalPosts([]);
        setProfile((previous) => ({
          ...previous,
          postsCount: 0,
        }));
      }
    };

    void loadPersonalPosts();
  }, [targetUserId]);

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} />
      <section className="space-y-4">
        {personalPosts.map((post) => (
          <PostCard key={post.id} post={post} currentUser={currentUser} />
        ))}
      </section>
    </div>
  );
};

