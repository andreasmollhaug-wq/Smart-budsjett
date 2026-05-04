/*
  Fjerner SmartVane-skjema. Idempotent (trygt hvis tabeller allerede mangler).
  Erstatter tidligere 010/013 i repo — kjør på eksisterende miljø som hadde SmartVane.
*/

drop table if exists public.smartvane_completion_daily cascade;
drop table if exists public.smartvane_completion_weekly cascade;
drop table if exists public.smartvane_completion_monthly cascade;
drop table if exists public.smartvane_habit cascade;
drop table if exists public.smartvane_month_plan cascade;

drop type if exists public.smartvane_habit_kind cascade;
