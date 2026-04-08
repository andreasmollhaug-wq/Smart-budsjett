/** Importformat fra Excel-mal (transaksjons-CSV). */
export const IMPORT_FORMAT_V1 = 'v1' as const

/** Maks filstørrelse (5 MB). */
export const TRANSACTION_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024

/** Maks antall datarader som parses (etter header). */
export const TRANSACTION_IMPORT_MAX_DATA_ROWS = 10_000
