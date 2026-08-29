import { create } from 'zustand';
import { StudyArea, Scenario, ModelLevel } from '../types';

interface SimulationDraftState {
  studyArea: Partial<StudyArea> | null;
  scenario: Partial<Scenario> | null;
  selectedModelLevel: ModelLevel;
  setStudyArea: (area: Partial<StudyArea>) => void;
  setScenario: (scenario: Partial<Scenario>) => void;
  setModelLevel: (level: ModelLevel) => void;
  resetDraft: () => void;
}

export const useSimulationDraftStore = create<SimulationDraftState>((set) => ({
  studyArea: null,
  scenario: null,
  selectedModelLevel: 'level1',
  setStudyArea: (area) => set((state) => ({ studyArea: { ...state.studyArea, ...area } })),
  setScenario: (scen) => set((state) => ({ scenario: { ...state.scenario, ...scen } })),
  setModelLevel: (level) => set({ selectedModelLevel: level }),
  resetDraft: () => set({ studyArea: null, scenario: null, selectedModelLevel: 'level1' })
}));
