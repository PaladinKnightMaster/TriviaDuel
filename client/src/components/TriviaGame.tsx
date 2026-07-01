import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { socketClient } from '../lib/socket';
import { Clock, Trophy, Flame, Users } from 'lucide-react';

export function TriviaGame() {
  const {
    currentQuestion,
    timeRemaining,
    selectedAnswer,
    isAnswered,
    players,
    questionNumber,
    totalQuestions,
    selectAnswer,
    setTimeRemaining,
  } = useTrivia();

  const { answerQuestion } = useSocket();

  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    points: number;
    correctAnswer: number;
  } | null>(null);

  // Refs so interval callbacks always see the latest values without re-creating the interval
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnsweredRef = useRef(isAnswered);
  const currentQuestionRef = useRef(currentQuestion);

  // Keep refs in sync with state
  useEffect(() => { isAnsweredRef.current = isAnswered; }, [isAnswered]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  // ── SMOOTH TIMER ────────────────────────────────────────────────────────────
  // Runs a single persistent interval per question, computing remaining time
  // from real wall-clock elapsed time (Date.now) — never drifts.
  useEffect(() => {
    if (!currentQuestion) return;

    // Mark when this question was received
    questionStartRef.current = Date.now();
    setTimeRemaining(currentQuestion.timeLimit);

    // Clear any previous interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeRemaining(remaining);

      // Auto-submit on timeout (only once, only if not already answered)
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        if (!isAnsweredRef.current && currentQuestionRef.current) {
          selectAnswer(-1);
          socketClient.emit('submitAnswer', {
            playerId: socketClient.id || '',
            questionId: currentQuestionRef.current.id,
            selectedAnswer: -1,
            timeToAnswer: Date.now(),
          });
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuestion?.id]); // Only re-run when the question itself changes

  // ── ANSWER FEEDBACK ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleAnswerResult = (result: any) => {
      setAnswerFeedback({
        isCorrect: result.isCorrect,
        points: result.points,
        correctAnswer: result.correctAnswer,
      });
    };

    socketClient.on('answerResult', handleAnswerResult);
    return () => socketClient.off('answerResult', handleAnswerResult);
  }, []);

  // Clear feedback when a new question arrives
  useEffect(() => {
    setAnswerFeedback(null);
  }, [currentQuestion?.id]);

  // ── ANSWER SELECTION ────────────────────────────────────────────────────────
  const handleAnswerSelect = (answerIndex: number) => {
    if (!isAnswered && currentQuestion && timeRemaining > 0) {
      selectAnswer(answerIndex);
      // Emit directly using current socket.id — bypasses any stale store playerId
      socketClient.emit('submitAnswer', {
        playerId: socketClient.id || '',
        questionId: currentQuestion.id,
        selectedAnswer: answerIndex,
        timeToAnswer: Date.now(),
      });
    }
  };

  // ── STYLING ─────────────────────────────────────────────────────────────────
  const getAnswerButtonClass = (index: number): string => {
    if (!isAnswered) {
      return 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white hover:border-indigo-400 transition-all';
    }
    if (index === currentQuestion?.correctAnswer) {
      return 'bg-green-600 border-green-500 text-white scale-[1.01]';
    }
    if (index === selectedAnswer && index !== currentQuestion?.correctAnswer) {
      return 'bg-red-600 border-red-500 text-white';
    }
    return 'bg-gray-700 border-gray-600 text-gray-400 opacity-60';
  };

  const timeLimit = currentQuestion?.timeLimit ?? 30;
  // Display as whole seconds, clamped 0–timeLimit
  const displaySeconds = Math.ceil(Math.max(0, Math.min(timeRemaining, timeLimit)));
  const timePercentage = (timeRemaining / timeLimit) * 100;

  const timerColor =
    timePercentage > 50 ? 'text-green-400' :
    timePercentage > 25 ? 'text-yellow-400' :
    'text-red-400';

  const barColor =
    timePercentage > 50 ? 'bg-green-500' :
    timePercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  // ── LOADING STATE ───────────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-black/50 border-purple-500/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-3xl mb-3 animate-spin inline-block">⏳</div>
            <p className="text-white text-xl">Loading next question...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header: Question progress + Timer */}
        <div className="flex items-center justify-between">
          <div className="bg-black/40 rounded-xl px-4 py-2 border border-white/10">
            <span className="text-white/60 text-sm">Question </span>
            <span className="text-white font-bold">{questionNumber}</span>
            <span className="text-white/40 text-sm"> / {totalQuestions}</span>
          </div>

          <div className={`flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-white/10 ${timerColor}`}>
            <Clock className="w-4 h-4" />
            <span className="font-bold text-lg tabular-nums w-10 text-center">{displaySeconds}s</span>
          </div>

          <div className="flex gap-2">
            <Badge className="bg-indigo-800 text-indigo-200 border-indigo-700 text-xs hidden sm:inline-flex">
              {currentQuestion.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={`text-xs ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-800 text-green-200 border-green-700' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-800 text-yellow-200 border-yellow-700' :
              'bg-red-800 text-red-200 border-red-700'
            }`}>
              {currentQuestion.difficulty.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Timer bar — updates every 100ms, no CSS transition needed */}
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full ${barColor}`}
            style={{ width: `${Math.max(0, timePercentage)}%`, transition: 'width 0.1s linear' }}
          />
        </div>

        {/* Answer feedback */}
        {answerFeedback && (
          <div className={`rounded-xl p-3 text-center font-bold border ${
            answerFeedback.isCorrect
              ? 'bg-green-600/80 text-white border-green-400'
              : 'bg-red-600/80 text-white border-red-400'
          }`}>
            {answerFeedback.isCorrect
              ? `✓ Correct! +${answerFeedback.points} pts`
              : '✗ Wrong answer'}
          </div>
        )}

        {/* Question */}
        <Card className="bg-black/50 border-blue-500/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg md:text-xl text-center leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered || timeRemaining <= 0}
                  className={`p-4 text-left rounded-xl border-2 font-medium ${getAnswerButtonClass(index)}`}
                >
                  <span className="font-bold text-indigo-300 mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Scoreboard */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-white/80 text-sm flex items-center gap-2 font-medium">
              <Users className="w-4 h-4" />
              Live Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((player, index) => {
                  const isAI = player.id.startsWith('ai_');
                  const isMe = player.id === socketClient.id;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isMe ? 'bg-indigo-900/50 border border-indigo-500/30' : 'bg-gray-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                        <span className="text-white text-sm font-medium">
                          {isAI ? '🤖 AI' : player.name}
                          {isMe && <span className="text-indigo-400 text-xs ml-1">(you)</span>}
                        </span>
                        {player.streak >= 2 && (
                          <div className="flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span className="text-orange-400 text-xs font-bold">{player.streak}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        <span className="text-white font-bold text-sm tabular-nums">
                          {player.score.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
