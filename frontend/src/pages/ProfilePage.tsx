import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { PostCard } from '../components/PostCard';
import { ProfileHeader } from '../components/ProfileHeader';
import { posts as mockPosts, profileMock } from '../data/mockData';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';

export const ProfilePage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [profile, setProfile] = useState<Profile>(profileMock);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.getProfileById(currentUser.id);
        setProfile(data);
      } catch {
        setProfile({
          ...profileMock,
          id: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        });
      }
    };

    void loadProfile();
  }, [currentUser]);

  const personalPosts = useMemo(
    () => mockPosts.filter((post) => post.author.id === currentUser.id || post.author.id === profile.id),
    [currentUser.id, profile.id],
  );

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

