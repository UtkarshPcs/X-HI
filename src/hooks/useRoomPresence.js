/**
 * useRoomPresence.js
 * Joins the room's presence sub-collection on mount, leaves on unmount.
 * Subscribes to the live list of online members.
 */

import { useState, useEffect, useMemo } from 'react';
import { joinPresence, subscribeToPresence } from '../services/studyRoomService';

/**
 * @param {string|null} roomId
 * @param {object|null} currentUser - { phone, name }
 * @param {function} onKicked - callback when user is logged in from another device
 * @returns {{ members: object[], memberCount: number }}
 */
export function useRoomPresence(roomId, currentUser, onKicked) {
  const [members, setMembers] = useState([]);
  
  // Generate a unique session ID for this tab/device
  const localSessionId = useMemo(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);

  // Join presence (heartbeat) — cleanup removes the doc on unmount / navigate away
  useEffect(() => {
    if (!roomId || !currentUser?.phone) return;
    const cleanup = joinPresence(roomId, currentUser, localSessionId);
    return cleanup;
  }, [roomId, currentUser?.phone, localSessionId]);

  // Subscribe to online members list
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToPresence(roomId, (updatedMembers) => {
      setMembers(updatedMembers);
      
      // Check if another device took over our presence
      if (currentUser?.phone) {
        const myPresence = updatedMembers.find(m => m.phone === currentUser.phone);
        if (myPresence && myPresence.sessionId && myPresence.sessionId !== localSessionId) {
          if (onKicked) onKicked();
        }
      }
    });
    return unsub;
  }, [roomId, currentUser?.phone, localSessionId, onKicked]);

  return { members, memberCount: members.length };
}
