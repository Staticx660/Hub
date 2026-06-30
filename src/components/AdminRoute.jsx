import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          You don't have permission to view this page. Contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <Outlet />;
}