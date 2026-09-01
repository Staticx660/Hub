import { Outlet } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { ShieldAlert, Loader2 } from 'lucide-react';

/** Allows platform admins and anyone who administers at least one department. */
export default function DeptAdminRoute() {
  const { isPlatformAdmin, deptAdminIds, loading } = useUserPermissions();

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;
  }

  if (!isPlatformAdmin && (deptAdminIds || []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white">Department Admin Access Required</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          You don't have permission to manage any department. Contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <Outlet />;
}