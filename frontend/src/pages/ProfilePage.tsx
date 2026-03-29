import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

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

const PROFILE_POSTS_PAGE_SIZE = 100;

export const ProfilePage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [profile, setProfile] = useState<Profile>(() => DEFAULT_PROFILE(currentUser));
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);

  useEffect(() => {
    setProfile(DEFAULT_PROFILE(currentUser));

    const loadProfile = async () => {
      try {
        const data = await profileService.getProfileById(currentUser.id);
        setProfile((previous) => ({
          ...previous,
          ...data,
          bio: data.bio ?? previous.bio,
          coverUrl: data.coverUrl ?? previous.coverUrl,
          major: data.major ?? previous.major,
          year: data.year ?? previous.year,
        }));
      } catch {
        setProfile((previous) => ({
          ...previous,
          id: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        }));
      }
    };

    void loadProfile();
  }, [currentUser]);

  useEffect(() => {
    const loadPersonalPosts = async () => {
      try {
        const response = await postService.getPosts(1, PROFILE_POSTS_PAGE_SIZE);
        const items = response.items.filter((post) => post.author.id === currentUser.id);
        setPersonalPosts(items);
      } catch {
        setPersonalPosts([]);
      }
    };

    void loadPersonalPosts();
  }, [currentUser.id]);

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

