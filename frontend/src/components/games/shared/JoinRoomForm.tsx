import { useState } from 'react';
import type { FormEvent } from 'react';

interface JoinRoomFormProps {
  onJoin: (roomCode: string) => Promise<void> | void;
}

export const JoinRoomForm = ({ onJoin }: JoinRoomFormProps) => {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    await onJoin(normalized);
    setRoomCode('');
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex items-center gap-2">
      <input
        value={roomCode}
        onChange={(event) => setRoomCode(event.target.value)}
        placeholder="Enter room code"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        className="rounded-lg border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/15"
      >
        Join
      </button>
    </form>
  );
};
