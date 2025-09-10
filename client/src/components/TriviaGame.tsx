import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useTrivia } from '../lib/stores/useTrivia';
import { useSocket } from '../lib/stores/useSocket';
import { Clock, Trophy, Flame, Users } from 'lucide-react';

export function TriviaGame() {
  const {
    currentQuestion,
    timeRemaining,
    selectedAnswer,
    isAnswered,
    players,
    selectAnswer,
    setTimeRemaining,
    setPhase
  } = useTrivia();

  const { answerQuestion, currentRoom } = useSocket();
  const [showResults, setShowResults] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (currentQuestion && timeRemaining > 0 && !isAnswered) {
      const timer = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    
    // Auto-submit when time runs out
    if (currentQuestion && timeRemaining === 0 && !isAnswered) {
      selectAnswer(-1); // -1 indicates no answer/timeout
      answerQuestion(currentQuestion.id, -1);
    }
  }, [currentQuestion, timeRemaining, isAnswered, setTimeRemaining, selectAnswer, answerQuestion]);

  // Listen for game end events
  useEffect(() => {
    const { socket } = useSocket();
    if (!socket) return;
    
    const handleGameEnd = (results: any) => {
      console.log('Game ended:', results);
      setGameEnded(true);
      setShowResults(true);
      
      // Show results for 5 seconds then go back to menu
      setTimeout(() => {
        setPhase('menu');
      }, 5000);
    };

    const handleAnswerResult = (result: any) => {
      console.log('Answer result:', result);
      setShowResults(true);
      setTimeout(() => setShowResults(false), 2000);
    };

    socket.on('gameEnded', handleGameEnd);
    socket.on('answerResult', handleAnswerResult);

    return () => {
      socket.off('gameEnded', handleGameEnd);
      socket.off('answerResult', handleAnswerResult);
    };
  }, [setPhase]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!isAnswered && currentQuestion) {
      selectAnswer(answerIndex);
      answerQuestion(currentQuestion.id, answerIndex);
    }
  };

  const getAnswerButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-gray-800 hover:bg-gray-700 border-gray-600 text-white";
    }
    
    if (index === currentQuestion?.correctAnswer) {
      return "bg-green-600 border-green-500 text-white";
    }
    
    if (index === selectedAnswer && index !== currentQuestion?.correctAnswer) {
      return "bg-red-600 border-red-500 text-white";
    }
    
    return "bg-gray-600 border-gray-500 text-gray-300";
  };

  const timePercentage = currentQuestion ? (timeRemaining / currentQuestion.timeLimit) * 100 : 0;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-black/50 border-purple-500/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-white text-xl">Waiting for next question...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Timer and Progress */}
        <Card className="bg-black/50 border-red-500/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-400" />
                <span className="text-white font-bold text-lg">{timeRemaining}s</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                {currentQuestion.category.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={`${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </Badge>
            </div>
            <Progress 
              value={timePercentage} 
              className="h-3"
              style={{
                background: timePercentage > 50 ? '#10B981' : timePercentage > 25 ? '#F59E0B' : '#EF4444'
              }}
            />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="bg-black/50 border-blue-500/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-xl text-center">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered || timeRemaining <= 0}
                  className={`p-4 text-left h-auto whitespace-normal ${getAnswerButtonClass(index)}`}
                  variant="outline"
                >
                  <span className="font-bold mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Players Score */}
        <Card className="bg-black/50 border-green-500/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-gold-400' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                    }`} />
                    <span className="text-white font-medium">{player.name}</span>
                    {player.streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 text-sm font-bold">{player.streak}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-bold">{player.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
