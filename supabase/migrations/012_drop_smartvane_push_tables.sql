-- Fjernet Web Push for SmartVane (kun klokken i appen). Dropp tilhørende tabeller om de finnes.

drop table if exists public.smartvane_push_subscription;
drop table if exists public.smartvane_notification_prefs;
