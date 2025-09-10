import { Question } from '../shared/schema';

interface QuestionData {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

const questionBank: QuestionData[] = [
  // Science Questions
  {
    category: 'science',
    difficulty: 'easy',
    question: 'What planet is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Earth', 'Mars'],
    correctAnswer: 1,
    timeLimit: 15
  },
  {
    category: 'science',
    difficulty: 'medium',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    timeLimit: 20
  },
  {
    category: 'science',
    difficulty: 'hard',
    question: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Cytoplasm'],
    correctAnswer: 2,
    timeLimit: 25
  },

  // History Questions
  {
    category: 'history',
    difficulty: 'easy',
    question: 'In which year did World War II end?',
    options: ['1944', '1945', '1946', '1947'],
    correctAnswer: 1,
    timeLimit: 15
  },
  {
    category: 'history',
    difficulty: 'medium',
    question: 'Who was the first President of the United States?',
    options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'],
    correctAnswer: 2,
    timeLimit: 20
  },
  {
    category: 'history',
    difficulty: 'hard',
    question: 'Which ancient wonder of the world was located in Alexandria?',
    options: ['Colossus of Rhodes', 'Lighthouse of Alexandria', 'Hanging Gardens', 'Temple of Artemis'],
    correctAnswer: 1,
    timeLimit: 25
  },

  // Pop Culture Questions
  {
    category: 'pop_culture',
    difficulty: 'easy',
    question: 'Which movie won the Academy Award for Best Picture in 2020?',
    options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'],
    correctAnswer: 2,
    timeLimit: 15
  },
  {
    category: 'pop_culture',
    difficulty: 'medium',
    question: 'Who sang the hit song "Shape of You"?',
    options: ['Ed Sheeran', 'Justin Bieber', 'Bruno Mars', 'The Weeknd'],
    correctAnswer: 0,
    timeLimit: 20
  },
  {
    category: 'pop_culture',
    difficulty: 'hard',
    question: 'In which TV series would you find the character Walter White?',
    options: ['Better Call Saul', 'Breaking Bad', 'The Wire', 'Dexter'],
    correctAnswer: 1,
    timeLimit: 25
  },

  // Sports Questions
  {
    category: 'sports',
    difficulty: 'easy',
    question: 'How many players are on a basketball team on the court at one time?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    timeLimit: 15
  },
  {
    category: 'sports',
    difficulty: 'medium',
    question: 'Which country has won the most FIFA World Cups?',
    options: ['Germany', 'Argentina', 'Brazil', 'Italy'],
    correctAnswer: 2,
    timeLimit: 20
  },
  {
    category: 'sports',
    difficulty: 'hard',
    question: 'In tennis, what is the maximum number of sets in a Grand Slam men\'s match?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    timeLimit: 25
  },

  // Geography Questions
  {
    category: 'geography',
    difficulty: 'easy',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Rome'],
    correctAnswer: 2,
    timeLimit: 15
  },
  {
    category: 'geography',
    difficulty: 'medium',
    question: 'Which is the longest river in the world?',
    options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'],
    correctAnswer: 1,
    timeLimit: 20
  },
  {
    category: 'geography',
    difficulty: 'hard',
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Nauru', 'Vatican City', 'San Marino'],
    correctAnswer: 2,
    timeLimit: 25
  },

  // General Knowledge Questions
  {
    category: 'general',
    difficulty: 'easy',
    question: 'How many days are there in a week?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    timeLimit: 15
  },
  {
    category: 'general',
    difficulty: 'medium',
    question: 'What is the largest mammal in the world?',
    options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    correctAnswer: 1,
    timeLimit: 20
  },
  {
    category: 'general',
    difficulty: 'hard',
    question: 'Which element has the atomic number 1?',
    options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'],
    correctAnswer: 1,
    timeLimit: 25
  }
];

export class QuestionBank {
  private questions: QuestionData[];

  constructor() {
    this.questions = [...questionBank];
  }

  getRandomQuestion(category?: string, difficulty?: string): Question | null {
    let filteredQuestions = this.questions;

    if (category && category !== 'general') {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }

    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    if (filteredQuestions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    const questionData = filteredQuestions[randomIndex];

    return {
      id: Math.random().toString(36).substr(2, 9),
      ...questionData
    };
  }

  getQuestionsByCategory(category: string, count: number = 10): Question[] {
    const categoryQuestions = this.questions.filter(q => q.category === category);
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, count).map(questionData => ({
      id: Math.random().toString(36).substr(2, 9),
      ...questionData
    }));
  }

  getQuestionsByDifficulty(difficulty: string, count: number = 10): Question[] {
    const difficultyQuestions = this.questions.filter(q => q.difficulty === difficulty);
    const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, count).map(questionData => ({
      id: Math.random().toString(36).substr(2, 9),
      ...questionData
    }));
  }
}
