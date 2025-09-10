import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Brain, History, Music, Trophy, Globe, Beaker } from 'lucide-react';

const categories = [
  {
    id: 'science',
    name: 'Science',
    icon: Beaker,
    color: 'bg-blue-500',
    description: 'Physics, Chemistry, Biology, and more'
  },
  {
    id: 'history',
    name: 'History',
    icon: History,
    color: 'bg-amber-500',
    description: 'World events, civilizations, and timeline'
  },
  {
    id: 'pop_culture',
    name: 'Pop Culture',
    icon: Music,
    color: 'bg-pink-500',
    description: 'Movies, music, celebrities, and trends'
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: Trophy,
    color: 'bg-green-500',
    description: 'All sports, athletes, and competitions'
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: Globe,
    color: 'bg-cyan-500',
    description: 'Countries, capitals, and landmarks'
  },
  {
    id: 'general',
    name: 'General Knowledge',
    icon: Brain,
    color: 'bg-purple-500',
    description: 'Mixed topics and random facts'
  }
];

const difficulties = [
  { id: 'easy', name: 'Easy', color: 'bg-green-100 text-green-800' },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'hard', name: 'Hard', color: 'bg-red-100 text-red-800' }
];

export function CategorySelect() {
  return (
    <Card className="bg-black/50 border-blue-500/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-center">Game Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="p-4 rounded-lg bg-gray-800/50 border border-gray-600 hover:border-gray-500 transition-all text-center space-y-2"
              >
                <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mx-auto`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white text-sm">{category.name}</h3>
                <p className="text-xs text-gray-400">{category.description}</p>
              </div>
            );
          })}
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-gray-300 text-sm">Available Difficulty Levels:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {difficulties.map((difficulty) => (
              <Badge key={difficulty.id} className={difficulty.color}>
                {difficulty.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
