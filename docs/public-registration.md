# Public account registration

Public signup is disabled by default. Set `OCTOP_PUBLIC_REGISTRATION=true` and
restart the service to enable **Create account** on `/login`. Set it to `false`
and restart to close signup without affecting existing accounts.

Initial administrator setup must already be complete. Signup cannot create or
replace the initial administrator. The form asks for a username (3–64 ASCII
letters/numbers/dots/underscores/hyphens, starting with a letter or number), an
optional display name, a password and password confirmation. Passwords follow
the existing policy. After creation, the user signs in normally.

Public accounts always have role `user`, access to personal experts and usage,
and a maximum of one expert. They do not receive administrator, user-management,
terminal, browser, desktop or mobile grants. No expert is started automatically.
Administrators can adjust permissions and quotas later through Users.

There is no email field or email verification in this version. A successful
signup does not assert a verified identity. The configured login captcha also
applies to signup; the default slider is a UI interaction rather than a
server-verified third-party captcha. Use the supported captcha providers when
stronger bot verification is required.

Registration attempts are limited in memory to five per identified client per
minute and thirty overall per minute, per process. These limits reset on
restart. Client identity uses the existing trusted-proxy resolver; callers
behind an untrusted shared proxy share a bucket. Keep the staging deployment at
one replica. These limits do not replace per-user model/token quotas.

API:

- `GET /api/auth/registration`: `{ "enabled": true|false }` after initial setup.
- `POST /api/auth/register`: username, password, optional display_name, locale,
  and captcha_token. Returns HTTP 201 with the username; no session token.
- Role, permission, quota and other unknown fields are rejected.

The application remains MIT licensed; preserve the original license notices.
