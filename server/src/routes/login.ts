import { setCookie } from "hono/cookie";
import { Hono } from "hono";
import type { AppConfig } from "../config";
import { credentialsMatch, createSessionToken, SESSION_COOKIE } from "../auth/session";

function loginPage(failed: boolean): string {
  const errorBlock = failed
    ? `<p class="error" role="alert">Login failed. Check your username and password.</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f4f1ea" />
    <title>Sign in · Fluxoid</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100svh;
        display: grid;
        place-items: center;
        background: #f4f1ea;
        color: #292524;
        font-family: "IBM Plex Sans", system-ui, sans-serif;
      }
      main {
        width: min(100%, 22rem);
        padding: 2rem 1.5rem;
      }
      h1 {
        margin: 0 0 0.35rem;
        font-family: "Archivo Narrow", system-ui, sans-serif;
        font-size: 1.65rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-align: center;
        text-transform: uppercase;
      }
      p.sub {
        margin: 0 0 1.75rem;
        text-align: center;
        font-size: 0.875rem;
        color: #57534e;
      }
      form {
        display: grid;
        gap: 0.75rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #44403c;
      }
      input {
        width: 100%;
        border: 1px solid #d6d3d1;
        border-radius: 0.75rem;
        padding: 0.65rem 0.85rem;
        font: inherit;
        background: #fff;
      }
      input:focus {
        outline: 2px solid #292524;
        outline-offset: 1px;
      }
      button {
        margin-top: 0.35rem;
        border: 0;
        border-radius: 999px;
        padding: 0.75rem 1rem;
        font: inherit;
        font-weight: 600;
        color: #fafaf9;
        background: #292524;
        cursor: pointer;
      }
      button:active { transform: scale(0.98); }
      .error {
        margin: 0 0 1rem;
        padding: 0.65rem 0.85rem;
        border-radius: 0.75rem;
        background: #fee2e2;
        color: #991b1b;
        font-size: 0.875rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Fluxoid</h1>
      <p class="sub">Sign in to continue</p>
      ${errorBlock}
      <form method="post" action="/login">
        <label>
          Username
          <input name="username" autocomplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </main>
  </body>
</html>`;
}

export function createLoginRouter(config: AppConfig): Hono {
  const router = new Hono();

  router.get("/login", (c) => {
    if (!config.auth.enabled) {
      return c.redirect("/");
    }

    const failed = c.req.query("failed") === "1";
    return c.html(loginPage(failed));
  });

  router.post("/login", async (c) => {
    if (!config.auth.enabled) {
      return c.redirect("/");
    }

    const body = await c.req.parseBody();
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!credentialsMatch(username, password, config.auth.username, config.auth.password)) {
      return c.redirect("/login?failed=1");
    }

    const token = createSessionToken(username, config.auth.secret);
    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.auth.secureCookies,
      sameSite: "Lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return c.redirect("/");
  });

  router.post("/logout", (c) => {
    setCookie(c, SESSION_COOKIE, "", {
      httpOnly: true,
      secure: config.auth.secureCookies,
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    });
    return c.redirect("/login");
  });

  return router;
}
