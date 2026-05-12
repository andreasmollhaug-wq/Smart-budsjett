-- Eksisterende lagret app-tilstand uten sidebarNavMode skal tolkes som «detaljert» meny (bakoverkompatibilitet).
update public.user_app_state
set state = state || jsonb_build_object('sidebarNavMode', 'detailed')
where not (state ? 'sidebarNavMode');
