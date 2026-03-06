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

// Auth Middleware
function isLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// HOME - redirect to login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// REGISTER PAGE
app.get("/register", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Register</title>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; 
               align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
        .box { background: white; padding: 40px; border-radius: 10px; 
               box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
        h2 { text-align: center; color: #333; }
        input { width: 100%; padding: 10px; margin: 10px 0; 
                border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #4CAF50; 
                 color: white; border: none; border-radius: 5px; 
                 cursor: pointer; font-size: 16px; }
        button:hover { background: #45a049; }
        p { text-align: center; }
        a { color: #4CAF50; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>📝 Register</h2>
        <form method="POST" action="/register">
          <input type="text" name="username" placeholder="Enter username" required />
          <input type="password" name="password" placeholder="Enter password" required />
          <button type="submit">Register</button>
        </form>
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </body>
    </html>
  `);
});

// REGISTER - handle form
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const user = new User(username, password);
  await user.register();
  res.send(`
    <html>
    <head>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; 
               align-items: center; height: 100vh; background: #f0f2f5; }
        .box { background: white; padding: 40px; border-radius: 10px; 
               box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        a { color: #4CAF50; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>✅ User registered successfully!</h2>
        <p><a href="/login">Click here to Login</a></p>
      </div>
    </body>
    </html>
  `);
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Login</title>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; 
               align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
        .box { background: white; padding: 40px; border-radius: 10px; 
               box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
        h2 { text-align: center; color: #333; }
        input { width: 100%; padding: 10px; margin: 10px 0; 
                border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #008CBA; 
                 color: white; border: none; border-radius: 5px; 
                 cursor: pointer; font-size: 16px; }
        button:hover { background: #007aa3; }
        p { text-align: center; }
        a { color: #008CBA; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>🔐 Login</h2>
        <form method="POST" action="/login">
          <input type="text" name="username" placeholder="Enter username" required />
          <input type="password" name="password" placeholder="Enter password" required />
          <button type="submit">Login</button>
        </form>
        <p>No account? <a href="/register">Register</a></p>
      </div>
    </body>
    </html>
  `);
});

// LOGIN - handle form
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = new User(username, password);
  const found = await user.login();
  if (found) {
    req.session.user = username;
    res.redirect("/dashboard");
  } else {
    res.send(`
      <html>
      <head>
        <style>
          body { font-family: Arial; display: flex; justify-content: center; 
                 align-items: center; height: 100vh; background: #f0f2f5; }
          .box { background: white; padding: 40px; border-radius: 10px; 
                 box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
          a { color: #008CBA; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>❌ Wrong username or password</h2>
          <p><a href="/login">Try again</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

// DASHBOARD - protected
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Dashboard</title>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; 
               align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
        .box { background: white; padding: 40px; border-radius: 10px; 
               box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; width: 300px; }
        h2 { color: #333; }
        a { display: block; margin-top: 20px; padding: 10px; 
            background: #e74c3c; color: white; text-decoration: none; 
            border-radius: 5px; }
        a:hover { background: #c0392b; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>🏠 Dashboard</h2>
        <p>Welcome <strong>${req.session.user}</strong>!</p>
        <p>You are logged in successfully.</p>
        <a href="/logout">Logout</a>
      </div>
    </body>
    </html>
  `);
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send(`
    <html>
    <head>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; 
               align-items: center; height: 100vh; background: #f0f2f5; }
        .box { background: white; padding: 40px; border-radius: 10px; 
               box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        a { color: #008CBA; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>👋 Logout successful!</h2>
        <p><a href="/login">Login again</a></p>
      </div>
    </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});