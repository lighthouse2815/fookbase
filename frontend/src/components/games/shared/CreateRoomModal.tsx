interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: () => Promise<void> | void;
}

export const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create room</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          This room will be private. Share room code so your friend can join.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void onCreateRoom();
            }}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            Create room
          </button>
        </div>
      </div>
    </div>
  );
};

