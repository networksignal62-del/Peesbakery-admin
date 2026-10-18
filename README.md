# Pee's Bakery staff panel

This repository contains the Next.js staff panel. The panel is also integrated into the [PeesBakery customer repository](https://github.com/networksignal62-del/PeesBakery) so it can be served at `https://peesbakery.rest/admin` from one deployment. Deploy the customer repository for the shared domain and keep panel changes synchronized until the code is consolidated.

## Develop

```bash
npm ci
npm run dev
npx tsc --noEmit
npm run build
```

Copy `.env.example` to `.env.local` and use your own Supabase project values. The service-role key is server-only. Never commit it or a staff password.

## Release requirements

- Rotate the previously committed Supabase service-role key and embedded password. The old values remain in public Git history until revoked.
- Back up the database and apply `db/002_staff_roles_and_safe_orders.sql` before deploying either application. This adds staff roles, replaces permissive RLS policies, and adds an atomic guest order function.
- Create the owner in Supabase Auth and an active `admin_profiles` row with role `super_admin`. Staff invitations are sent from **Staff access**.
- Allow `https://peesbakery.rest/admin/welcome` in Supabase Auth redirect URLs and configure production email delivery.
- Set `NEXT_PUBLIC_SITE_URL=https://peesbakery.rest` in the shared-domain deployment.
- Verify owner, manager, staff, and waiter permissions against the live database. A build does not prove that RLS policies or invitation email work.

| Role | Access |
| --- | --- |
| Owner | Staff accounts, catalog, settings, orders, digital menu |
| Admin / Manager | Catalog, settings, orders, digital menu |
| Staff | Orders and digital menu |
| Waiter | Digital menu and own account |

The panel includes password change under **My account**. Product image uploads and staff invitations require an active authorized session on the server.

The customer repository's `AUDIT.md` records local verification and the remaining live release checks.
