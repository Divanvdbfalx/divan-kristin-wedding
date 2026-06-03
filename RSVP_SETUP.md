# RSVP storage setup

The RSVP form posts to `/api/rsvp`. Submissions are stored in Supabase and can be viewed at `/admin`.

## Required environment variables

Set these in Vercel before deploying:

- `WEBSITE_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RSVP_ADMIN_PASSWORD`

Use the Supabase service role key only inside Vercel environment variables. Do not put it in browser JavaScript.

`WEBSITE_PASSWORD` protects the entire website with a browser password prompt before any page, API route, script, stylesheet, or image is served. The username defaults to `guest`. To use a different username, also set `WEBSITE_USERNAME`.

## Supabase table

Run the SQL in `supabase-rsvp-schema.sql` in the Supabase SQL editor before using the form.

## Admin view

After deployment, visit `/admin`, enter the `RSVP_ADMIN_PASSWORD`, and the page will show total replies, attending count, declined count, and each guest's submitted details/message.
