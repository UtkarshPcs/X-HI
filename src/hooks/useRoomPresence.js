/**
 * useRoomPresence.js
 * Joins the room's presence sub-collection on mount, leaves on unmount.
 * Subscribes to the live list of online members.
 */

import { useState, useEffect } from 'react';
import { joinPresence, subscribeToPresence } from '../services/studyRoomService';

/**
 * @param {string|null} roomId
 * @param {object|null} currentUser - { phone, name }
 * @returns {{ members: object[], memberCount: number }}
 */
export function useRoomPresence(roomId, currentUser) {
  const [members, setMembers] = useState([]);

  // Join presence (heartbeat) — cleanup removes the doc on unmount / navigate away
  useEffect(() => {
    if (!roomId || !currentUser?.phone) return;
    const cleanup = joinPresence(roomId, currentUser);
    return cleanup;
  }, [roomId, currentUser?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to online members list
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToPresence(roomId, setMembers);
    return unsub;
  }, [roomId]);

  return { members, memberCount: members.length };
}
