require("./db");
const express = require("express");
const session = require("express-session");
const User = require("./user");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "mySecret123",
  resave: false,
  saveUninitialized: false,
}));

function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("Please login first");
  }

  next();
}

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Register</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; }
        .card { max-width: 420px; margin: 60px auto; background: #fff; padding: 20px; border-radius: 8px; }
        h2 { margin-top: 0; }
        input, button { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; }
        button { border: 0; background: #2d6cdf; color: #fff; cursor: pointer; }
        a { color: #2d6cdf; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Register</h2>
        <form method="POST" action="/register">
          <input type="text" name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Register</button>
        </form>
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </body>
    </html>
  `);
});

app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Login</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; }
        .card { max-width: 420px; margin: 60px auto; background: #fff; padding: 20px; border-radius: 8px; }
        h2 { margin-top: 0; }
        input, button { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; }
        button { border: 0; background: #2d6cdf; color: #fff; cursor: pointer; }
        a { color: #2d6cdf; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Login</h2>
        <form method="POST" action="/login">
          <input type="text" name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <p>New here? <a href="/register">Register</a></p>
      </div>
    </body>
    </html>
  `);
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    const user = new User(username, password);
    const result = await user.register();
    if (result === "Username already exists") {
      return res.status(409).send('Username already exists. <a href="/register">Try again</a>');
    }

    res.send('User registered successfully. <a href="/login">Go to login</a>');
  } catch (error) {
    res.status(500).send("Registration failed");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    const user = new User(username, password);
    const foundUser = await user.login();

    if (!foundUser) {
      return res.status(401).send('Invalid username or password. <a href="/login">Try again</a>');
    }

    req.session.user = username;
    res.redirect("/dashboard");
  } catch (error) {
    res.status(500).send("Login failed");
  }
});

app.get("/dashboard", authMiddleware, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; }
        .card { max-width: 420px; margin: 60px auto; background: #fff; padding: 20px; border-radius: 8px; }
        a { color: #c0392b; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Dashboard</h2>
        <p>Welcome ${req.session.user}</p>
        <p><a href="/logout">Logout</a></p>
      </div>
    </body>
    </html>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.send('Logout successful. <a href="/login">Login again</a>');
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});