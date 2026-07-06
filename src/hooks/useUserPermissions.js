import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

/**
 * Determines the current user's CAD permissions.
 * - Platform admin (User.role === "admin") always gets full access.
 * - CAD admin / supervisor flags come from the user's CADPersonnel record,
 *   matched by discord_id (linked via Settings).
 */
export function useUserPermissions() {
  const { user } = useAuth();
  const [perms, setPerms] = useState({
    isPlatformAdmin: false,
    isCADAdmin: false,
    isSupervisor: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setPerms({ isPlatformAdmin: false, isCADAdmin: false, isSupervisor: false, loading: false });
      return;
    }

    const isPlatformAdmin = user.role === "admin";
    if (isPlatformAdmin) {
      setPerms({ isPlatformAdmin: true, isCADAdmin: true, isSupervisor: true, loading: false });
      return;
    }

    if (!user.discord_id) {
      setPerms({ isPlatformAdmin: false, isCADAdmin: false, isSupervisor: false, loading: false });
      return;
    }

    let cancelled = false;
    base44.entities.CADPersonnel.filter({ discord_id: user.discord_id })
      .then((list) => {
        if (cancelled) return;
        const p = list[0];
        setPerms({
          isPlatformAdmin: false,
          isCADAdmin: p?.is_cad_admin || false,
          isSupervisor: p?.is_supervisor || false,
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPerms({ isPlatformAdmin: false, isCADAdmin: false, isSupervisor: false, loading: false });
      });

    return () => { cancelled = true; };
  }, [user]);

  return perms;
}