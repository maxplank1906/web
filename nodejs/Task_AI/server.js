const path = require("path");
const express = require("express");
const session = require("express-session");
const connectDatabase = require("./db");
const User = require("./user");

const app = express();
const PORT = 4000;

connectDatabase();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "task_ai_secret_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

function pageTemplate({ title, subtitle, body, accent = "#1f6feb" }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link
      rel="preconnect"
      href="https://fonts.googleapis.com"
    />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #f7f6f2;
        --ink: #141414;
        --card: #ffffff;
        --accent: ${accent};
        --muted: #6a6a6a;
        --line: #e9e7df;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Space Grotesk", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 85% 10%, #c4d8ff 0%, transparent 35%),
          radial-gradient(circle at 10% 90%, #ffe4bf 0%, transparent 35%),
          var(--bg);
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
      }

      .card {
        width: 100%;
        max-width: 460px;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 30px 24px;
        box-shadow: 0 14px 35px rgba(10, 10, 10, 0.08);
        animation: slideIn 320ms ease;
      }

      h1 {
        margin: 0;
        font-size: 28px;
        letter-spacing: -0.02em;
      }

      .subtitle {
        margin: 8px 0 24px;
        color: var(--muted);
        line-height: 1.5;
      }

      form {
        display: grid;
        gap: 12px;
      }

      input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 12px;
        font: inherit;
      }

      input:focus {
        outline: 2px solid color-mix(in srgb, var(--accent) 40%, white);
        border-color: var(--accent);
      }

      button,
      .button-link {
        width: 100%;
        border: 0;
        border-radius: 12px;
        background: var(--accent);
        color: #fff;
        font: inherit;
        font-weight: 700;
        padding: 12px 14px;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
      }

      .helper {
        margin-top: 16px;
        color: var(--muted);
        text-align: center;
      }

      .helper a {
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
      }

      .stack {
        display: grid;
        gap: 10px;
      }

      @keyframes slideIn {
        from {
          transform: translateY(8px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 480px) {
        .card {
          padding: 22px 16px;
        }

        h1 {
          font-size: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
      ${body}
    </main>
  </body>
</html>`;
}

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.send(
    pageTemplate({
      title: "Create Account",
      subtitle: "Register a new user for the studentDB login system.",
      accent: "#11786b",
      body: `
        <form method="POST" action="/register">
          <input type="text" name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Register</button>
        </form>
        <p class="helper">Already have an account? <a href="/login">Login</a></p>
      `,
    })
  );
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    const user = new User(username, password);
    const result = await user.register();

    if (!result.success) {
      return res.status(409).send(result.message);
    }

    return res.send("User registered successfully");
  } catch (error) {
    return res.status(500).send("Registration failed");
  }
});

app.get("/login", (req, res) => {
  res.send(
    pageTemplate({
      title: "Welcome Back",
      subtitle: "Login with your username and password to open dashboard.",
      accent: "#1f6feb",
      body: `
        <form method="POST" action="/login">
          <input type="text" name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <p class="helper">Need an account? <a href="/register">Register</a></p>
      `,
    })
  );
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    const user = new User(username, password);
    const result = await user.login();

    if (!result.success) {
      return res.status(401).send(result.message);
    }

    req.session.user = username;
    return res.send("Login successful");
  } catch (error) {
    return res.status(500).send("Login failed");
  }
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.send(
    pageTemplate({
      title: "Dashboard",
      subtitle: `Welcome ${req.session.user}`,
      accent: "#7d4ee4",
      body: `
        <div class="stack">
          <p>Welcome ${req.session.user}</p>
          <a class="button-link" href="/logout">Logout</a>
        </div>
      `,
    })
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.send("Logout successful");
  });
});

app.listen(PORT, () => {
  console.log(`Task_AI server running at http://localhost:${PORT}`);
});
