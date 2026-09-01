import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

/**
 * Determines the current user's CAD permissions by calling the backend
 * syncUserPermissions function, which:
 *  - Reads the user's CADPersonnel record (matched by discord_id)
 *  - Checks Discord guild roles for supervisor status
 *  - Syncs the user's email to the personnel record
 *  - Returns effective permission flags
 *
 * Platform admins always receive full access.
 */
export function useUserPermissions() {
  const { user } = useAuth();
  const [perms, setPerms] = useState({
    isPlatformAdmin: false,
    isSystemManager: false,
    isSystemAdmin: false,
    isCADAdmin: false,
    isSupervisor: false,
    deptAdminIds: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setPerms({ isPlatformAdmin: false, isSystemManager: false, isSystemAdmin: false, isCADAdmin: false, isSupervisor: false, deptAdminIds: [], loading: false });
      return;
    }

    let cancelled = false;
    base44.functions.invoke('syncUserPermissions', {})
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setPerms({
          isPlatformAdmin: data.isPlatformAdmin || false,
          isSystemManager: data.isSystemManager || false,
          isSystemAdmin: data.isSystemAdmin || false,
          isCADAdmin: data.isCADAdmin || false,
          isSupervisor: data.isSupervisor || false,
          deptAdminIds: data.deptAdminIds || [],
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // On failure, only report platform admin status — CAD perms unknown, default to false
        const isPlatformAdmin = user.role === 'admin';
        setPerms({
          isPlatformAdmin,
          isSystemManager: isPlatformAdmin,
          isSystemAdmin: isPlatformAdmin,
          isCADAdmin: isPlatformAdmin,
          isSupervisor: false,
          deptAdminIds: [],
          loading: false,
        });
      });

    return () => { cancelled = true; };
  }, [user]);

  return perms;
}