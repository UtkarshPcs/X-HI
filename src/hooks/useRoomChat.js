/**
 * useRoomChat.js
 * Subscribes to the messages sub-collection and exposes a send function.
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribeToMessages, sendMessage } from '../services/studyRoomService';

/**
 * @param {string|null} roomId
 * @param {object|null} currentUser - { phone, name }
 * @returns {{
 *   messages: object[],
 *   sending: boolean,
 *   send: (text: string) => Promise<void>,
 * }}
 */
export function useRoomChat(roomId, currentUser) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToMessages(roomId, setMessages);
    return unsub;
  }, [roomId]);

  const send = useCallback(async (text) => {
    if (!roomId || !currentUser || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(roomId, currentUser, text);
    } finally {
      setSending(false);
    }
  }, [roomId, currentUser]);

  return { messages, sending, send };
}
