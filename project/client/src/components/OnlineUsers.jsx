export default function OnlineUsers({ users }) {
  if (!users || users.length === 0) return null;

  const avatarColors = [
    'from-indigo-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600',
    'from-cyan-500 to-blue-600',
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2">
        {users.slice(0, 4).map((u, i) => (
          <div
            key={u._id || i}
            title={`${u.name || 'User'} (Online)`}
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${
              avatarColors[i % avatarColors.length]
            } flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-xs relative transition hover:scale-110 hover:z-20 cursor-pointer`}
            style={{ zIndex: users.length - i }}
          >
            {u.name?.charAt(0).toUpperCase() || '?'}
          </div>
        ))}

        {users.length > 4 && (
          <div
            title={`${users.length - 4} more collaborators`}
            className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            +{users.length - 4}
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{users.length} active</span>
      </div>
    </div>
  );
}
