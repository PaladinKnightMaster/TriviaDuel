import { create } from 'zustand';
import { socketClient } from '../socket';
import { CustomCategory } from '../../../../shared/schema';

interface CustomCategoryState {
  publicCategories: CustomCategory[];
  myCategories: CustomCategory[];
  searchResults: CustomCategory[];
  loading: boolean;
  searchLoading: boolean;

  fetchPublic: () => void;
  fetchMine: () => void;
  search: (term: string) => void;
  deleteCategory: (categoryId: number) => void;
  rate: (categoryId: number, rating: number) => void;
  setPublic: (cats: CustomCategory[]) => void;
  setMine: (cats: CustomCategory[]) => void;
  setSearch: (cats: CustomCategory[]) => void;
  removeFromMine: (categoryId: number) => void;
  setLoading: (v: boolean) => void;
  setSearchLoading: (v: boolean) => void;
}

export const useCustomCategory = create<CustomCategoryState>((set, get) => ({
  publicCategories: [],
  myCategories: [],
  searchResults: [],
  loading: false,
  searchLoading: false,

  fetchPublic: () => {
    set({ loading: true });
    socketClient.emit('getPublicCategories', { limit: 20 });
  },

  fetchMine: () => {
    set({ loading: true });
    socketClient.emit('getUserCategories', {});
  },

  search: (term: string) => {
    if (!term.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ searchLoading: true });
    socketClient.emit('searchCategories', { searchTerm: term, isPublicOnly: true });
  },

  deleteCategory: (categoryId: number) => {
    socketClient.emit('deleteCustomCategory', { categoryId });
  },

  rate: (categoryId: number, rating: number) => {
    socketClient.emit('rateCategory', { categoryId, rating });
  },

  setPublic: (cats) => set({ publicCategories: cats, loading: false }),
  setMine: (cats) => set({ myCategories: cats, loading: false }),
  setSearch: (cats) => set({ searchResults: cats, searchLoading: false }),
  removeFromMine: (categoryId) =>
    set((s) => ({ myCategories: s.myCategories.filter((c) => c.id !== categoryId) })),
  setLoading: (v) => set({ loading: v }),
  setSearchLoading: (v) => set({ searchLoading: v }),
}));
