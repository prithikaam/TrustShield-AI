/*
# Lock down trigger function execution

1. Purpose
- Revoke EXECUTE on `sync_user_role_to_jwt()` from anon and authenticated roles so it cannot be called directly via the REST API.
- The function is only used by a database trigger, never by the frontend.

2. Security
- Prevents any user from directly calling the SECURITY DEFINER function that modifies auth.users metadata.
*/

REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_jwt() FROM anon, authenticated;