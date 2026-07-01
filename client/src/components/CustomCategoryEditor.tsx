import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronRight, Loader2, Globe, Lock, CheckCircle } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { CustomCategory, CustomQuestion } from '../../../shared/schema';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DraftQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  difficulty: Difficulty;
  explanation: string;
}

const BLANK_QUESTION: DraftQuestion = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  difficulty: 'medium',
  explanation: '',
};

type Step = 'info' | 'questions' | 'done';

export function CustomCategoryEditor({ onClose, onCreated }: Props) {
  // Step 1 — category info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Step 2 — questions
  const [step, setStep] = useState<Step>('info');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [addedQuestions, setAddedQuestions] = useState<string[]>([]);
  const [draft, setDraft] = useState<DraftQuestion>({ ...BLANK_QUESTION });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [qError, setQError] = useState<string | null>(null);

  // Step 1 submit
  const handleCreateCategory = () => {
    if (!name.trim()) { setInfoError('Category name is required.'); return; }
    if (name.trim().length > 60) { setInfoError('Name must be 60 characters or less.'); return; }
    setInfoError(null);
    setCreatingCategory(true);

    const onCreatedCat = (cat: CustomCategory) => {
      socketClient.off('customCategoryCreated', onCreatedCat);
      setCategoryId(cat.id);
      setCreatingCategory(false);
      setStep('questions');
    };
    socketClient.on('customCategoryCreated', onCreatedCat);
    socketClient.emit('createCustomCategory', { name: name.trim(), description: description.trim(), isPublic });
  };

  // Step 2 — add a question
  const validateQuestion = (): string | null => {
    if (!draft.question.trim()) return 'Question text is required.';
    for (let i = 0; i < 4; i++) {
      if (!draft.options[i].trim()) return `Option ${i + 1} is required.`;
    }
    return null;
  };

  const handleAddQuestion = () => {
    const err = validateQuestion();
    if (err) { setQError(err); return; }
    if (!categoryId) return;
    if (addedQuestions.length >= 20) { setQError('Maximum 20 questions per category.'); return; }
    setQError(null);
    setAddingQuestion(true);

    const onAdded = (q: CustomQuestion) => {
      socketClient.off('customQuestionAdded', onAdded);
      setAddedQuestions((prev) => [...prev, draft.question.trim()]);
      setDraft({ ...BLANK_QUESTION });
      setAddingQuestion(false);
    };
    socketClient.on('customQuestionAdded', onAdded);
    socketClient.emit('addCustomQuestion', {
      categoryId,
      question: draft.question.trim(),
      options: draft.options.map((o) => o.trim()),
      correctAnswer: draft.correctAnswer,
      difficulty: draft.difficulty,
      explanation: draft.explanation.trim() || undefined,
    });
  };

  const handleDraftOption = (index: number, value: string) => {
    setDraft((d) => {
      const opts = [...d.options] as [string, string, string, string];
      opts[index] = value;
      return { ...d, options: opts };
    });
  };

  const handleFinish = () => {
    if (addedQuestions.length < 1) {
      if (!confirm('You haven\'t added any questions. The category will be empty — finish anyway?')) return;
    }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-950 border border-teal-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">
              {step === 'info' ? 'New Category' : step === 'questions' ? `Add Questions — "${name}"` : 'Done!'}
            </h2>
            <p className="text-teal-400 text-xs mt-0.5">
              {step === 'info' ? 'Step 1 of 2 — Category details' : step === 'questions' ? `Step 2 of 2 — ${addedQuestions.length}/20 questions added` : ''}
            </p>
          </div>
          <button
            onClick={step === 'done' ? onCreated : onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1 — Info */}
        {step === 'info' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Category Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                placeholder="e.g. 90s Cartoons, Ancient Egypt..."
                maxLength={60}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of what this category covers..."
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2 block">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    !isPublic
                      ? 'bg-gray-700 border-gray-400 text-white'
                      : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Lock className="w-4 h-4" /> Private
                </button>
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    isPublic
                      ? 'bg-teal-700 border-teal-500 text-white'
                      : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Globe className="w-4 h-4" /> Public
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-1.5">
                {isPublic ? 'Anyone can browse and play this category.' : 'Only you can see and play this category.'}
              </p>
            </div>
            {infoError && <p className="text-red-400 text-sm">{infoError}</p>}
          </div>
        )}

        {/* STEP 2 — Questions */}
        {step === 'questions' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Added questions summary */}
            {addedQuestions.length > 0 && (
              <div className="bg-teal-900/30 border border-teal-500/30 rounded-xl p-3 space-y-1">
                <p className="text-teal-400 text-xs font-semibold mb-2">Added questions:</p>
                {addedQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                    <span className="truncate">{q}</span>
                  </div>
                ))}
              </div>
            )}

            {/* New question form */}
            {addedQuestions.length < 20 && (
              <div className="space-y-3 bg-gray-900/50 border border-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">Question {addedQuestions.length + 1}</p>

                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Question text *</label>
                  <textarea
                    value={draft.question}
                    onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                    placeholder="Enter your trivia question..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-400 text-xs block">Options (select the correct answer) *</label>
                  {([0, 1, 2, 3] as const).map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        onClick={() => setDraft((d) => ({ ...d, correctAnswer: i }))}
                        className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                          draft.correctAnswer === i
                            ? 'border-teal-400 bg-teal-400'
                            : 'border-gray-500 hover:border-teal-400'
                        }`}
                        title={`Mark option ${i + 1} as correct`}
                      />
                      <input
                        value={draft.options[i]}
                        onChange={(e) => handleDraftOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}${i === draft.correctAnswer ? ' (correct)' : ''}`}
                        className={`flex-1 px-3 py-1.5 rounded-lg bg-gray-800 border text-sm text-white placeholder-gray-500 focus:outline-none transition-colors ${
                          draft.correctAnswer === i
                            ? 'border-teal-500/70 bg-teal-900/20'
                            : 'border-gray-600 focus:border-teal-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-1 block">Difficulty</label>
                    <div className="flex gap-1">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDraft((dr) => ({ ...dr, difficulty: d }))}
                          className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                            draft.difficulty === d
                              ? 'bg-teal-700 text-white'
                              : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Explanation (optional)</label>
                  <input
                    value={draft.explanation}
                    onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
                    placeholder="Why is this the correct answer?"
                    className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 text-sm"
                  />
                </div>

                {qError && <p className="text-red-400 text-xs">{qError}</p>}

                <button
                  onClick={handleAddQuestion}
                  disabled={addingQuestion}
                  className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {addingQuestion
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                    : <><Plus className="w-4 h-4" /> Add Question</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          {step === 'info' && (
            <button
              onClick={handleCreateCategory}
              disabled={creatingCategory}
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {creatingCategory
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                : <><ChevronRight className="w-4 h-4" /> Continue — Add Questions</>}
            </button>
          )}
          {step === 'questions' && (
            <div className="space-y-2">
              <button
                onClick={handleFinish}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Finish ({addedQuestions.length} question{addedQuestions.length !== 1 ? 's' : ''} added)
              </button>
              {addedQuestions.length < 3 && (
                <p className="text-yellow-500 text-xs text-center">
                  Add at least 3 questions so others can play a full set.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
