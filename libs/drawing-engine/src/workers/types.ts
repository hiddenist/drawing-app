// Shared types for communication between frontend and history worker

// Types for serialized data (what gets stored in IndexedDB)
export interface SerializedColor {
  r?: number
  g?: number
  b?: number
  vector?: Uint8ClampedArray | number[]
}

export interface SerializedLineDrawInfo {
  tool: 'brush' | 'eraser'  // Exclude eyedropper since it doesn't get stored
  path: Array<[number, number, number?]>  // Matches InputPoint tuple structure
  options: {
    color: SerializedColor
    opacity: number
    diameter: number
  }
}

export interface SerializedClearInfo {
  tool: 'clear'
}

export type SerializedToolInfo = SerializedLineDrawInfo | SerializedClearInfo

// Serialized history action with ID
export interface SerializedHistoryAction {
  id: number
  action: SerializedToolInfo
}

// Complete serialized history state
export interface SerializedHistoryState {
  actions: SerializedHistoryAction[]
  currentIndex: number // ID of the current action (0 = empty state, 1+ = action IDs)
}

// Worker message types
export interface WorkerMessage {
  id: string
  type: 'SAVE_ACTION' | 'SAVE_STATE' | 'LOAD_RECENT' | 'LOAD_STATE' | 'CLEAR_HISTORY' | 'DELETE_OLD' | 'FLUSH_BATCH'
  data?: {
    action?: SerializedToolInfo
    state?: SerializedHistoryState
    limit?: number
    keepCount?: number
  }
}

// Worker response types
export interface WorkerResponse {
  id?: string
  type: string
  data?: {
    state?: SerializedHistoryState
    entries?: Array<{
      id?: number | string
      state?: SerializedHistoryState
      timestamp: number
    }>
    id?: number | string
    actionCount?: number
  }
  error?: string
  success?: boolean
  unknownError?: unknown
}

// Database entry structure
export interface HistoryEntry {
  id?: number | string // More specific than IDBValidKey but covers our use cases
  state: SerializedHistoryState
  timestamp: number
}