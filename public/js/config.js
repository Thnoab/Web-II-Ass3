// config.js

const API_CONFIG = {
  DEVELOPMENT: 'http://localhost:3000/Assessment3',
  PRODUCTION: window.location.origin + '/Assessment3'
};

function getApiBaseUrl() {
  return `http://24516989.it.scu.edu.au/Assessment3`;
}

window.API_BASE_URL = getApiBaseUrl();

console.log('✅ API Base URL =', window.API_BASE_URL);

