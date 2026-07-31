import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  captureGroupTokenFromLocation,
  readGroupToken,
  buildGroupJoinLink,
} from '@/lib/groupInviteLink';

/**
 * Deep-link handler for group invite QR codes / links.
 *
 * 1. Captures a token from any URL (`?token=`, `?group=`, `?joinGroup=`) so it
 *    survives login, OAuth redirects and PWA cold starts.
 * 2. Once the visitor is authenticated, forwards them to `/join-group` with the
 *    token pre-filled — no manual copy/paste needed.
 */
export const usePendingGroupInvite = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  // Capture as early as possible, on every navigation.
  useEffect(() => {
    captureGroupTokenFromLocation();
  }, [location.key]);

  useEffect(() => {
    if (loading || !user) return;
    if (location.pathname.startsWith('/join-group')) return;
    if (location.pathname.startsWith('/auth/callback')) return;
    if (redirectedRef.current) return;

    const token = readGroupToken();
    if (!token) return;

    redirectedRef.current = true;
    const url = new URL(buildGroupJoinLink(token));
    navigate(`${url.pathname}${url.search}`, { replace: false });
  }, [user, loading, location.pathname, navigate]);
};