# Level Up Dashboard: Backend & Database Rules

To prevent persistent 500 Internal Server Errors and 401 Unauthorized errors, follow these rules strictly when modifying the backend or database.

## 1. User Context & RLS (Row Level Security)
Most tables in this project use RLS to protect user data. When querying the database from an API route:

*   **Rule**: Always set the user context before any database operation.
*   **Helper**: Use `authenticatedSupabaseQuery` from `@/lib/supabase/jwt-verification`.
*   **Manual**: If not using the helper, you MUST call `public.set_user_context(userId)` via RPC first:
    ```typescript
    await supabaseServer.rpc('public.set_user_context', { user_id: userId });
    ```
*   **Why**: Clerk User IDs are strings, but Supabase default authentication expects UUIDs. The `set_user_context` function bridges this gap by setting session variables that RLS policies can see.

## 2. User ID Data Types
*   **Rule**: **NEVER** use the `UUID` type for `user_id` columns. Always use `TEXT`.
*   **Why**: Clerk (our authentication provider) uses string IDs like `user_2p4...`. Inserting these into a `UUID` column will cause an immediate database error (500).
*   **Fix**: If you create a new table, ensure `user_id` is defined as `TEXT`.

## 3. API Authentication
*   **Rule**: Use `auth()` from `@clerk/nextjs/server` to get the `userId` in API routes.
*   **Rule**: Pass the verified `userId` to any manager function that interacts with the database.
*   **Example**:
    ```typescript
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
    // Proceed with database query
    ```

## 4. Circular Dependencies
The Kingdom page is particularly sensitive to circular imports which cause `ReferenceError: Cannot access 'X' before initialization`.

*   **Rule**: Keep constants (like `TEXT_CONTENT`) in "leaf" files that have no dependencies on other project logic.
*   **Rule**: Use `dynamic` imports for large components or managers that might create circular chains.
*   **Rule**: Avoid "Barrel" files (`index.ts` that export everything in a folder) as they are the primary cause of build-time circularity issues in Next.js.

## 5. Deployment Consistency
*   **Rule**: Always maintain the `concurrency` lock in `.github/workflows/deploy.yml`.
*   **Rule**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is present in the environment for server-side operations.
*   **Why**: Without the service role key, the backend cannot bypass or satisfy RLS policies using the standardized helpers.

## 6. Table-Specific Fixes
If you encounter 500 errors on a specific feature, check if its table was recently added and ensure:
1. RLS is enabled.
2. A policy matching `user_id = public.get_current_user_id()` exists.
3. The table is included in the `public.set_user_context` standardized list.
