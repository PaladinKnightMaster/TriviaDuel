import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Edit3, FilePlus2, Loader2, RotateCcw, Save, ShieldCheck, X } from 'lucide-react';
import type { ManagedQuestion } from '../../../shared/schema';
import { useAuth } from '../lib/stores/useAuth';

const CATEGORIES = [
  { value: 'general', label: 'General Knowledge' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'pop_culture', label: 'Pop Culture' },
  { value: 'sports', label: 'Sports' },
  { value: 'geography', label: 'Geography' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
type Difficulty = typeof DIFFICULTIES[number];
type StatusFilter = 'all' | 'active' | 'retired';

interface QuestionForm {
  category: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface Props {
  onBack: () => void;
}

const emptyForm: QuestionForm = {
  category: 'general',
  difficulty: 'medium',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 20,
};

function toForm(question: ManagedQuestion): QuestionForm {
  return {
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    options: [...question.options],
    correctAnswer: question.correctAnswer,
    timeLimit: question.timeLimit,
  };
}

export function AdminQuestionManager({ onBack }: Props) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<ManagedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [editing, setEditing] = useState<ManagedQuestion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<QuestionForm>(emptyForm);

  const loadQuestions = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load questions');
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [token]);

  const filteredQuestions = useMemo(() => questions.filter((question) => {
    if (categoryFilter !== 'all' && question.category !== categoryFilter) return false;
    if (difficultyFilter !== 'all' && question.difficulty !== difficultyFilter) return false;
    if (statusFilter === 'active' && !question.isActive) return false;
    if (statusFilter === 'retired' && question.isActive) return false;
    return true;
  }), [questions, categoryFilter, difficultyFilter, statusFilter]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, options: [...emptyForm.options] });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (question: ManagedQuestion) => {
    setEditing(question);
    setForm(toForm(question));
    setError(null);
    setShowForm(true);
  };

  const updateOption = (index: number, value: string) => {
    setForm((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });
  };

  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const trimmedOptions = form.options.map((option) => option.trim());
    if (!form.question.trim() || trimmedOptions.some((option) => !option)) {
      setError('Add a question and all four answer options.');
      return;
    }
    if (new Set(trimmedOptions.map((option) => option.toLowerCase())).size !== 4) {
      setError('Answer options must be unique.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editing ? `/api/admin/questions/${encodeURIComponent(editing.id)}` : '/api/admin/questions',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...form, question: form.question.trim(), options: trimmedOptions }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save question');
      setQuestions((current) => editing
        ? current.map((question) => question.id === data.id ? data : question)
        : [data, ...current]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save question');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (question: ManagedQuestion) => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/questions/${encodeURIComponent(question.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !question.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update question status');
      setQuestions((current) => current.map((item) => item.id === data.id ? data : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update question status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white flex flex-col">
      <header className="border-b border-white/10 bg-black/20 px-5 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="Back to lobby">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <h1 className="text-xl font-bold">Question Catalog</h1>
            </div>
            <p className="text-xs text-white/50 mt-0.5">Manage the questions used in new matches</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-bold transition-colors">
            <FilePlus2 className="w-4 h-4" />
            New question
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-5 py-5 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="catalog-select">
            <option value="all">All categories</option>
            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
          <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as 'all' | Difficulty)} className="catalog-select">
            <option value="all">All difficulties</option>
            {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty[0].toUpperCase() + difficulty.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="catalog-select">
            <option value="active">Active questions</option>
            <option value="retired">Retired questions</option>
            <option value="all">All statuses</option>
          </select>
        </div>

        {error && !showForm && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={loadQuestions} className="text-red-100 hover:text-white underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-300 animate-spin" /></div>
        ) : filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 py-16 text-center text-white/50">
            No questions match these filters.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-white/50">{filteredQuestions.length} question{filteredQuestions.length === 1 ? '' : 's'}</div>
            {filteredQuestions.map((question) => (
              <article key={question.id} className={`rounded-2xl border p-4 ${question.isActive ? 'border-white/10 bg-black/30' : 'border-white/5 bg-black/15 opacity-70'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="catalog-badge">{CATEGORIES.find((category) => category.value === question.category)?.label || question.category}</span>
                      <span className="catalog-badge">{question.difficulty}</span>
                      <span className={`catalog-badge ${question.isActive ? 'text-emerald-300' : 'text-white/40'}`}>{question.isActive ? 'Active' : 'Retired'}</span>
                      <span className="text-xs text-white/40">{question.timeLimit}s</span>
                    </div>
                    <h2 className="font-semibold text-white/90">{question.question}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm text-white/55">
                      {question.options.map((option, index) => (
                        <div key={`${question.id}-${index}`} className={index === question.correctAnswer ? 'text-emerald-300' : ''}>
                          {index === question.correctAnswer ? <Check className="inline w-3.5 h-3.5 mr-1" /> : <span className="inline-block w-3.5 mr-1" />}
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => openEdit(question)} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10" title="Edit question">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(question)} className="p-2 rounded-lg text-white/50 hover:text-amber-200 hover:bg-amber-900/30" title={question.isActive ? 'Retire question' : 'Reactivate question'}>
                      {question.isActive ? <X className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={saveQuestion} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-indigo-400/30 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{editing ? 'Edit question' : 'New question'}</h2>
                <p className="text-xs text-white/50 mt-1">{editing ? 'The question ID stays stable for existing match history.' : 'New questions are active immediately.'}</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {error && <div className="mb-4 rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="catalog-label">Category
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="catalog-input">
                  {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
              <label className="catalog-label">Difficulty
                <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as Difficulty })} className="catalog-input">
                  {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty[0].toUpperCase() + difficulty.slice(1)}</option>)}
                </select>
              </label>
            </div>

            <label className="catalog-label mt-4">Question
              <textarea value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} className="catalog-input min-h-24 resize-y" maxLength={500} required />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {form.options.map((option, index) => (
                <label key={index} className="catalog-label">Option {index + 1}
                  <input value={option} onChange={(event) => updateOption(index, event.target.value)} className="catalog-input" maxLength={200} required />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="catalog-label">Correct option
                <select value={form.correctAnswer} onChange={(event) => setForm({ ...form, correctAnswer: Number(event.target.value) })} className="catalog-input">
                  {form.options.map((_, index) => <option key={index} value={index}>Option {index + 1}</option>)}
                </select>
              </label>
              <label className="catalog-label">Time limit (seconds)
                <input type="number" value={form.timeLimit} onChange={(event) => setForm({ ...form, timeLimit: Number(event.target.value) })} className="catalog-input" min={5} max={120} required />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Save changes' : 'Create question'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}