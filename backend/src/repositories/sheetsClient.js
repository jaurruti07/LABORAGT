/**
 * Cliente Google Sheets — Service Account
 * Solo se usa cuando DATA_SOURCE=sheets y hay credenciales.
 */

const { google } = require('googleapis');

let sheetsApi = null;
let spreadsheetId = null;

function isConfigured() {
  return !!(
    process.env.GOOGLE_SHEETS_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
}

function getPrivateKey() {
  let key = process.env.GOOGLE_PRIVATE_KEY || '';
  // Render / .env suelen guardar \n como texto literal
  if (key.includes('\\n')) key = key.replace(/\\n/g, '\n');
  return key;
}

function getClient() {
  if (sheetsApi) return sheetsApi;
  if (!isConfigured()) {
    throw new Error('Google Sheets no está configurado (faltan variables de entorno)');
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: getPrivateKey(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  sheetsApi = google.sheets({ version: 'v4', auth });
  spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  return sheetsApi;
}

function getSpreadsheetId() {
  if (!spreadsheetId) getClient();
  return spreadsheetId;
}

/**
 * Lee un rango (ej. 'USUARIOS!A:W') y devuelve filas como arrays.
 * La primera fila se asume encabezado.
 */
async function readRange(range) {
  const api = getClient();
  const res = await api.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range
  });
  return res.data.values || [];
}

/**
 * Escribe / sobrescribe un rango completo.
 */
async function writeRange(range, values) {
  const api = getClient();
  await api.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

/**
 * Agrega filas al final de una hoja.
 */
async function appendRows(sheetName, rows) {
  const api = getClient();
  await api.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName + '!A:A',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows }
  });
}

/**
 * Convierte filas [header, ...data] a array de objetos.
 */
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h || '').trim());
  return rows.slice(1).filter((r) => r && r.some((c) => c !== '' && c != null)).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? String(row[i]) : '';
    });
    return obj;
  });
}

module.exports = {
  isConfigured,
  getClient,
  getSpreadsheetId,
  readRange,
  writeRange,
  appendRows,
  rowsToObjects
};
