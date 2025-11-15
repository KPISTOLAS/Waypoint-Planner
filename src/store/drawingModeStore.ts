import { atom } from 'jotai'

export type DrawingMode = 'cursor' | 'none' | 'rectangle' | 'polygon' | 'poi'

export const drawingModeAtom = atom<DrawingMode>('cursor')
export const drawingToolbarVisibleAtom = atom<boolean>(true)

