var Keycloak = require('keycloak-connect');

let _keycloak;

var keycloakConfig = {
  clientId: 'myclient',
  serverUrl: 'http://81.180.223.163:5070',
  realm: 'swrealm',
};

function initKeycloak(memoryStore) {
  if (_keycloak) {
    console.warn('Trying to init Keycloak again!');
    return _keycloak;
  } else {
    console.log('Initializing Keycloak...');
    _keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
    return _keycloak;
  }
}

function getKeycloak() {
  if (!_keycloak) {
    console.error('Keycloak has not been initialized. Please called initfirst.');
  }

  return _keycloak;
}

module.exports = {
  initKeycloak,
  getKeycloak,
};
