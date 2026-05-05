/** Importformat fra Excel-mal (transaksjons-CSV). */
export const IMPORT_FORMAT_V1 = 'v1' as const

/** Maks filstørrelse (5 MB). */
export const TRANSACTION_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024

/** Maks antall datarader som parses (etter header). */
export const TRANSACTION_IMPORT_MAX_DATA_ROWS = 10_000

/** Profil-ID for historikk/metadata ved Excel-mal-import. */
export const TEMPLATE_CSV_IMPORT_PROFILE_ID = 'excel_template_v1'

/** Maks lagrede Excel-mal-importkjøringer i historikk. */
export const TEMPLATE_CSV_IMPORT_HISTORY_MAX = 50
