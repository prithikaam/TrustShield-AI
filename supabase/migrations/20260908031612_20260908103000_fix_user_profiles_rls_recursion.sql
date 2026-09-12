/*
# Fix recursive user profile access rule

1. Purpose
- Removes the recursive staff-read policy from `user_profiles`.
- Keeps the owner-scoped profile policies unchanged so signed-in users can still read, create, and update their own profile.

2. Modified table
- `user_profiles`: removes `staff_read_all_user_profiles`, whose predicate queried `user_profiles` while evaluating `user_profiles` policies.

3. Security
- Users remain restricted to their own profile through `select_own_user_profile`, `insert_own_user_profile`, and `update_own_user_profile`.
- No data is deleted or changed.

4. Important notes
- This removes the source of the PostgreSQL infinite-recursion error.
- Staff-wide profile access is intentionally not re-added through a self-referencing policy.
*/

DROP POLICY IF EXISTS "staff_read_all_user_profiles" ON public.user_profiles;