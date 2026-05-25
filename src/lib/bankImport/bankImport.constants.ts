/** Maks filstørrelse for bankimport (samme orden som regnskap). */
export const BANK_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024

export const BANK_IMPORT_MAX_DATA_ROWS = 10_000

/** Maks antall lagrede bankimport-kjøringer i historikk. */
export const BANK_IMPORT_HISTORY_MAX = 50

export const BANK_IMPORT_PROFILE_ID = 'dnb_sbanken_v1'

export const SPAREBANK1_IMPORT_PROFILE_ID = 'sparebank1_v1'

export const NEONOMICS_IMPORT_PROFILE_ID = 'neonomics_sandbox_v1'

/**
 * Maks unike forklaringstyper (mapping-nøkler) per KI-kall.
 * Klienten sender flere kall automatisk når det er flere uklassifiserte typer.
 */
export const BANK_IMPORT_AI_MAX_KEYS_PER_REQUEST = 250
