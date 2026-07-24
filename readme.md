# Mock Keycloak API (json-server)

## Endpoints

All Keycloak endpoints are proxied via `routes.json` to json-server resources in `db.json`.

| Endpoint                                                     | Method | Maps to                        |
| ------------------------------------------------------------ | ------ | ------------------------------ |
| `/auth/realms/{realm}/.well-known/openid-configuration`      | GET    | `/openid-configuration`        |
| `/auth/realms/{realm}/protocol/openid-connect/auth`          | GET    | Login page (`login.html`)      |
| `/auth/realms/{realm}/protocol/openid-connect/token`         | POST   | `/token` (returns mock tokens) |
| `/auth/realms/{realm}/protocol/openid-connect/userinfo`      | GET    | `/userinfo`                    |
| `/auth/realms/{realm}/protocol/openid-connect/certs`         | GET    | `/certs`                       |
| `/auth/realms/{realm}/protocol/openid-connect/registrations` | POST   | 201 success (not persisted)    |

Supported realms: `master` and `{realm}`.

## Local development

```bash
npm install
npm start        # starts on PORT env var or 3000
npm run dev      # same, with auto-reload (node --watch)
```

## Netlify deployment

The `netlify/functions/server.js` function handles all `/auth/*` traffic (see `netlify.toml`).
`json-server` is kept in `dependencies` (not `devDependencies`) so Netlify installs it during the build.

## How the login flow works

1. Your app redirects to `/auth/realms/{realm}/protocol/openid-connect/auth?redirect_uri=...&state=...`
2. The mock login page is served. Click **Log In** with any credentials.
3. The page redirects back to `redirect_uri` with `?code=mock-authorization-code-12345&state=...`
4. Your app exchanges the code by POSTing to `/token` — the server converts it to a GET and returns the token from `db.json`.
