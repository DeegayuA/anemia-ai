import { create } from 'zustand'

interface UserState {
  name: string
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  knownHb: boolean | null
  hbValue: number | null
  scanResult: {
    anemia: 'yes' | 'no' | 'uncertain'
    severity: 'Severe' | 'Moderate' | 'Mild' | 'Non-Anemic'
    confidence: number
    estimatedHb: number
    heatmapUrl?: string
  } | null
  setName: (name: string) => void
  setAge: (age: number) => void
  setGender: (gender: 'male' | 'female' | 'other') => void
  setKnownHb: (known: boolean) => void
  setHbValue: (value: number) => void
  setScanResult: (result: UserState['scanResult']) => void
}

export const useUserStore = create<UserState>((set) => ({
  name: '',
  age: null,
  gender: null,
  knownHb: null,
  hbValue: null,
  scanResult: null,
  setName: (name) => set({ name }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setKnownHb: (knownHb) => set({ knownHb }),
  setHbValue: (hbValue) => set({ hbValue }),
  setScanResult: (scanResult) => set({ scanResult }),
}))
