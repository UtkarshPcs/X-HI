import { useState, useEffect, useCallback } from 'react';
import { updateQuizState, answerQuizQuestion, submitQuizScore, subscribeToQuizAnswers, subscribeToQuizScores } from '../services/studyRoomService';

/**
 * useLiveQuiz
 * Handles quiz state synchronization, decentralized auto-timer, and scoring.
 * 
 * @param {string} roomId 
 * @param {object} room - The room document (contains room.quizState, room.coHostPhones, room.ownerPhone)
 * @param {object} currentUser - Current user { phone, name }
 * @param {Array} onlineMembers - Active members from useRoomPresence
 */
export function useLiveQuiz(roomId, room, currentUser, onlineMembers) {
  const quizState = room?.quizState || null;
  const isOwner = currentUser?.phone === room?.ownerPhone;
  const coHostPhones = room?.coHostPhones || [];
  const isCoHost = coHostPhones.includes(currentUser?.phone);

  // Fault tolerance: Check if actual Admin and Co-Host are online
  const isAdminOnline = onlineMembers.some(m => m.phone === room?.ownerPhone);
  const isAnyCoHostOnline = onlineMembers.some(m => coHostPhones.includes(m.phone));

  // You are acting Admin if you are the Owner, OR if you are Co-Host and Admin is offline
  const isActingAdmin = isOwner || (isCoHost && !isAdminOnline);
  
  // Auto-timer decentralized check: If both are offline, any active client can advance
  const isDecentralizedFallback = !isAdminOnline && !isAnyCoHostOnline;

  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Listen for answers
  const hasQuiz = Boolean(quizState);
  const quizId = quizState?.quizId;
  useEffect(() => {
    if (!roomId || !hasQuiz || !quizId) return;
    setAnswers([]); // clear stale answers from previous quiz
    const unsub = subscribeToQuizAnswers(roomId, quizId, (data) => {
      setAnswers(data);
    });
    return unsub;
  }, [roomId, hasQuiz, quizId]);

  // Listen for scores
  useEffect(() => {
    if (!roomId || !hasQuiz || !quizId) return;
    setScores([]); // clear stale scores from previous quiz
    const unsub = subscribeToQuizScores(roomId, quizId, (data) => {
      setScores(data);
    });
    return unsub;
  }, [roomId, hasQuiz, quizId]);

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

  // Fastest Finger First: auto-advance when someone clicks
  useEffect(() => {
    if (quizState?.status === 'active' && quizState?.quizMode === 'fastest') {
      const currentAnswers = answers.filter(a => a.id === `q_${quizState.currentQuestionIndex}`);
      if (currentAnswers.length > 0) {
        if (isActingAdmin || isDecentralizedFallback) {
          updateQuizState(roomId, { 'quizState.status': 'revealing' }).catch(() => {});
        }
      }
    }
  }, [answers, quizState?.status, quizState?.quizMode, quizState?.currentQuestionIndex, isActingAdmin, isDecentralizedFallback, roomId]);

  const submitAnswer = useCallback(async (qIndex, optionIndex) => {
    if (!roomId || !currentUser || !quizState?.quizId) return;
    try {
      await answerQuizQuestion(roomId, quizState.quizId, qIndex, currentUser.phone, optionIndex, quizState.quizMode);
    } catch (e) {
      console.log('Answer rejected:', e.message);
    }
  }, [roomId, currentUser, quizState?.quizId, quizState?.quizMode]);

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
    await updateQuizState(roomId, { 
      'quizState.status': 'finished',
      mode: 'video' 
    });
  }, [roomId, isActingAdmin]);

  const replaceCurrentQuestion = useCallback(async () => {
    if (!roomId || !isActingAdmin || !quizState || !quizState.testId) return;
    try {
      const { getTestById } = await import('../services/starBatchTestService');
      const test = await getTestById(quizState.testId);
      if (!test || !test.questions) return;
      
      const allQs = test.questions.filter(q => !q.isDeleted);
      const usedIds = quizState.questions.map(q => q.id);
      const availableQs = allQs.filter(q => !usedIds.includes(q.id));
      
      if (availableQs.length === 0) {
        alert("No remaining questions available in this chapter to replace with.");
        return;
      }
      
      const randomQ = availableQs[Math.floor(Math.random() * availableQs.length)];
      
      const newQuestions = [...quizState.questions];
      newQuestions[quizState.currentQuestionIndex] = randomQ;
      
      await updateQuizState(roomId, {
        'quizState.questions': newQuestions,
        'quizState.status': 'reading',
        'quizState.questionStartedAt': null
      });
      
    } catch (e) {
      console.error(e);
    }
  }, [roomId, isActingAdmin, quizState]);

  const updateMyScore = useCallback(async (correctCount, wrongCount, score, totalTime) => {
    if (!roomId || !currentUser || !quizState?.quizId) return;
    await submitQuizScore(roomId, quizState.quizId, currentUser.phone, {
      name: currentUser.name,
      correctCount,
      wrongCount,
      score,
      totalTime
    });
  }, [roomId, currentUser, quizState?.quizId]);

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
    replaceCurrentQuestion,
    updateMyScore
  };
}
