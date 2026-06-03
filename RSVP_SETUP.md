# RSVP storage setup

The RSVP form posts to `/api/rsvp`. Submissions are stored in a Redis-compatible REST database and can be viewed at `/admin`.

## Required environment variables

Set these in Vercel before deploying:

- `KV_REST_API_URL` or `UPSTASH_REDIS_REST_URL`
- `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_TOKEN`
- `RSVP_ADMIN_PASSWORD`

Vercel KV/Redis and Upstash Redis both provide the REST URL and token values.

## Admin view

After deployment, visit `/admin`, enter the `RSVP_ADMIN_PASSWORD`, and the page will show total replies, attending count, declined count, and each guest's submitted details/message.
