import { Outlet } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * Route guard for the CAD Admin panel.
 * Allows platform admins, CAD admins, and supervisors.
 * Section-level filtering inside CADAdmin determines what each role sees.
 */
export default function CADAdminRoute() {
  const { isSystemAdmin, isSupervisor, loading } = useUserPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-cad-muted" />
      </div>
    );
  }

  if (!isSystemAdmin && !isSupervisor) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-cad-text">Supervisor Access Required</h2>
        <p className="text-sm text-cad-muted mt-2 max-w-sm">
          You need supervisor or admin permissions to view this page. Contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <Outlet />;
}