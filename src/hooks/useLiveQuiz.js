import { useState, useEffect, useCallback } from 'react';
import { updateQuizState, answerQuizQuestion, submitQuizScore, subscribeToQuizAnswers, subscribeToQuizScores } from '../services/studyRoomService';

/**
 * useLiveQuiz
 * Handles quiz state synchronization, decentralized auto-timer, and scoring.
 * 
 * @param {string} roomId 
 * @param {object} room - The room document (contains room.quizState, room.coHostPhone, room.ownerPhone)
 * @param {object} currentUser - Current user { phone, name }
 * @param {Array} onlineMembers - Active members from useRoomPresence
 */
export function useLiveQuiz(roomId, room, currentUser, onlineMembers) {
  const quizState = room?.quizState || null;
  const isOwner = currentUser?.phone === room?.ownerPhone;
  const isCoHost = currentUser?.phone === room?.coHostPhone;

  // Fault tolerance: Check if actual Admin and Co-Host are online
  const isAdminOnline = onlineMembers.some(m => m.phone === room?.ownerPhone);
  const isCoHostOnline = onlineMembers.some(m => m.phone === room?.coHostPhone);

  // You are acting Admin if you are the Owner, OR if you are Co-Host and Admin is offline
  const isActingAdmin = isOwner || (isCoHost && !isAdminOnline);
  
  // Auto-timer decentralized check: If both are offline, any active client can advance
  const isDecentralizedFallback = !isAdminOnline && !isCoHostOnline;

  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Listen for answers
  const hasQuiz = Boolean(quizState);
  useEffect(() => {
    if (!roomId || !hasQuiz) return;
    const unsub = subscribeToQuizAnswers(roomId, (data) => {
      setAnswers(data);
    });
    return unsub;
  }, [roomId, hasQuiz]);

  // Listen for scores
  useEffect(() => {
    if (!roomId || !hasQuiz) return;
    const unsub = subscribeToQuizScores(roomId, (data) => {
      setScores(data);
    });
    return unsub;
  }, [roomId, hasQuiz]);

  // Timer logic
  useEffect(() => {
    if (!quizState || quizState.status !== 'active' || !quizState.questionStartedAt) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const started = quizState.questionStartedAt; // Timestamp in ms
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const remaining = Math.max(0, quizState.timePerQuestion - elapsed);
      setTimeRemaining(remaining);

      // --- Decentralized Auto-Timer Fallback ---
      if (remaining === 0) {
        // If we are acting admin, or if it's fallback mode
        if (isActingAdmin || isDecentralizedFallback) {
          // Add a grace period to avoid simultaneous immediate writes
          // Acting admin transitions immediately. Fallback users wait a random delay (1-3s).
          const delay = isActingAdmin ? 0 : 1000 + Math.random() * 2000;
          setTimeout(() => {
            // Check if state is STILL active (someone else might have successfully transitioned it)
            if (room?.quizState?.status === 'active') {
              updateQuizState(roomId, { 'quizState.status': 'revealing' }).catch(() => {});
            }
          }, delay);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [quizState, isActingAdmin, isDecentralizedFallback, roomId, room?.quizState?.status]);

  const submitAnswer = useCallback(async (qIndex, optionIndex) => {
    if (!roomId || !currentUser) return;
    try {
      await answerQuizQuestion(roomId, qIndex, currentUser.phone, optionIndex, quizState.quizMode);
    } catch (e) {
      console.log('Answer rejected:', e.message);
    }
  }, [roomId, currentUser, quizState?.quizMode]);

  const nextQuestion = useCallback(async () => {
    if (!roomId || !isActingAdmin || !quizState) return;
    
    if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
      await updateQuizState(roomId, { 'quizState.status': 'finished' });
    } else {
      await updateQuizState(roomId, {
        'quizState.currentQuestionIndex': quizState.currentQuestionIndex + 1,
        'quizState.status': 'reading',
        'quizState.questionStartedAt': null
      });
    }
  }, [roomId, isActingAdmin, quizState]);

  const startTimer = useCallback(async () => {
    if (!roomId || !isActingAdmin) return;
    await updateQuizState(roomId, {
      'quizState.status': 'active',
      'quizState.questionStartedAt': Date.now()
    });
  }, [roomId, isActingAdmin]);

  const endQuiz = useCallback(async () => {
    if (!roomId || !isActingAdmin) return;
    await updateQuizState(roomId, { 'quizState.status': 'finished' });
  }, [roomId, isActingAdmin]);

  const updateMyScore = useCallback(async (correctCount, wrongCount, score, totalTime) => {
    if (!roomId || !currentUser) return;
    await submitQuizScore(roomId, currentUser.phone, {
      name: currentUser.name,
      correctCount,
      wrongCount,
      score,
      totalTime
    });
  }, [roomId, currentUser]);

  return {
    quizState,
    isActingAdmin,
    timeRemaining,
    answers,
    scores,
    submitAnswer,
    nextQuestion,
    startTimer,
    endQuiz,
    updateMyScore
  };
}
