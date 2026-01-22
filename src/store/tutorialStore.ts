import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TutorialStep, TutorialState } from '../types/game'
import { tutorialSteps } from '../components/Tutorial/tutorialSteps'

interface TutorialStore extends TutorialState {
  // Actions
  startTutorial: () => void
  nextStep: () => void
  previousStep: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  markStepComplete: (stepId: string) => void
  resetTutorial: () => void
  getCurrentStep: () => TutorialStep | null
}

export const useTutorialStore = create<TutorialStore>()(
  immer((set, get) => ({
    // Initial state
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    skipped: false,

    // Actions
    startTutorial: () => set((state) => {
      state.isActive = true
      state.currentStep = 0
      state.completedSteps = []
      state.skipped = false
    }),

    nextStep: () => set((state) => {
      const currentStepData = tutorialSteps[state.currentStep]
      if (currentStepData && !state.completedSteps.includes(currentStepData.id)) {
        state.completedSteps.push(currentStepData.id)
      }

      if (state.currentStep < tutorialSteps.length - 1) {
        state.currentStep++
      } else {
        state.isActive = false
      }
    }),

    previousStep: () => set((state) => {
      if (state.currentStep > 0) {
        state.currentStep--
      }
    }),

    skipTutorial: () => set((state) => {
      state.isActive = false
      state.skipped = true
    }),

    completeTutorial: () => set((state) => {
      state.isActive = false
      state.completedSteps = tutorialSteps.map(step => step.id)
    }),

    markStepComplete: (stepId: string) => set((state) => {
      if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId)
      }
    }),

    resetTutorial: () => set((state) => {
      state.isActive = false
      state.currentStep = 0
      state.completedSteps = []
      state.skipped = false
    }),

    getCurrentStep: () => {
      const state = get()
      return tutorialSteps[state.currentStep] || null
    },
  }))
)
