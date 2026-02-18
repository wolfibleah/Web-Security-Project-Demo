const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');

const app = express();
const PORT = 3000;
const memoryStore = new session.MemoryStore();

//session configuration
app.use(
  session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  }),
);

//init Keycloak
const keycloak = require('./keycloak-config').initKeycloak(memoryStore);
app.use(keycloak.middleware());

//public route
app.get('/', (req, res) => {
  res.send(`
    <h1>Lab 09 – OpenID Connect</h1>
    <a href="/private">Zona privată</a>
  `);
});

app.get('/private', keycloak.protect(), (req, res) => {
  const token = req.kauth.grant.access_token.content;

  const username = token.preferred_username;
  const email = token.email;
  const userId = token.sub;

  res.send(`
    <h2>Zona privată</h2>
    <p>Username: ${username}</p>
    <p>Email: ${email}</p>
    <p>User ID: ${userId}</p>

    <a href="/logout">Logout</a>
  `);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(
      'http://81.180.223.163:5070/realms/swrealm/protocol/openid-connect/logout' +
        '?redirect_uri=http://localhost:3000/',
    );
  });
});

app.listen(PORT, () => {
  console.log(`OIDC server running at http://localhost:${PORT}`);
});
