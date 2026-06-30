/**
 * useStudyRoom.js
 * Subscribes to a single study room document and exposes owner actions.
 * Used by StudyRoomPage.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToRoom,
  updateRoomVideo,
  setRoomLocked,
  endRoom,
  removeMember,
} from '../services/studyRoomService';

/**
 * @param {string|null} roomId  - Firestore room document ID
 * @param {string|null} ownerPhone - current user phone (to determine ownership)
 * @returns {{
 *   room: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   isOwner: boolean,
 *   changeVideo: (url: string) => Promise<void>,
 *   toggleLock: () => Promise<void>,
 *   kickMember: (phone: string) => Promise<void>,
 *   closeRoom: () => Promise<void>,
 * }}
 */
export function useStudyRoom(roomId, ownerPhone) {
  const [room, setRoom]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeToRoom(roomId, (data) => {
      if (data === null) {
        setError('Room not found or has been ended.');
      }
      setRoom(data);
      setLoading(false);
    });

    return unsub;
  }, [roomId]);

  const isOwner = Boolean(room && ownerPhone && room.ownerPhone === ownerPhone);

  const changeVideo = useCallback(async (url) => {
    if (!isOwner || !roomId) return;
    await updateRoomVideo(roomId, url);
  }, [isOwner, roomId]);

  const toggleLock = useCallback(async () => {
    if (!isOwner || !roomId || !room) return;
    await setRoomLocked(roomId, !room.isLocked);
  }, [isOwner, roomId, room]);

  const kickMember = useCallback(async (memberPhone) => {
    if (!isOwner || !roomId) return;
    await removeMember(roomId, memberPhone);
  }, [isOwner, roomId]);

  const closeRoom = useCallback(async () => {
    if (!isOwner || !roomId) return;
    await endRoom(roomId);
  }, [isOwner, roomId]);

  return { room, loading, error, isOwner, changeVideo, toggleLock, kickMember, closeRoom };
}
