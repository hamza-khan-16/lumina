# Admin Panel Setup

Access the admin panel at: `yoursite.com/admin`

## Default credentials
- Username: `admin`
- Password: `lumina2024`

**Change these in `src/lib/adminAuth.ts` before deploying!**

## Supabase — extra SQL needed for delete

Run this in your Supabase SQL Editor to allow photo deletion:

```sql
-- Allow delete on photos table
create policy "Admin delete" on photos for delete using (true);

-- Allow delete on storage
create policy "Admin storage delete"
  on storage.objects for delete
  using (bucket_id = 'photos');
```
