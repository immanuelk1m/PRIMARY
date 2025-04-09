import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
// /types/index.ts 를 사용한 경우
import type { Profile } from '../types';

interface UserState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUserAndProfile: (user: User | null, profile: Profile | null) => void;
  clearUser: () => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  isLoading: true, // 초기 로딩 상태 true
  setUserAndProfile: (user, profile) => set({ user, profile, isLoading: false }),
  clearUser: () => set({ user: null, profile: null, isLoading: false }),
  setProfile: (profile) => set((state) => ({ ...state, profile })), // 기존 상태를 유지하며 profile만 업데이트
  setLoading: (loading) => set({ isLoading: loading }),
}));