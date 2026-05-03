export const SMARTVANE_BASE_PATH = '/smartvane' as const

export const smartvanePaths = {
  root: SMARTVANE_BASE_PATH,
  today: `${SMARTVANE_BASE_PATH}/i-dag`,
  month: `${SMARTVANE_BASE_PATH}/maned`,
  insights: `${SMARTVANE_BASE_PATH}/insikt`,
  start: `${SMARTVANE_BASE_PATH}/start-her`,
} as const
