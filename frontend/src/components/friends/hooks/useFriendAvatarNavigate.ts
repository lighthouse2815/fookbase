import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export function useFriendAvatarNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (userId: string) => (event: MouseEvent) => {
      event.stopPropagation();
      void navigate(`/profile/${userId}`);
    },
    [navigate],
  );
}
