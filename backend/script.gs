// --- INSTRUCTIONS ---
// 1. Ouvrez votre projet Apps Script (Extensions > Apps Script dans votre Google Sheet).
// 2. Copiez tout ce code et remplacez le contenu de Code.gs.
// 3. (Optionnel) Exécutez la fonction 'setup' une fois pour créer les feuilles immédiatement.
// 4. Cliquez sur "Déployer" > "Nouveau déploiement".
// 5. Sélectionnez type : "Application Web".
// 6. Description : "V4 - Auto Headers".
// 7. Exécuter en tant que : "Moi" (votre compte).
// 8. Qui a accès : "Tout le monde" (IMPORTANT pour que l'app fonctionne).
// 9. Cliquez sur "Déployer" et copiez la nouvelle URL si elle change (mettez-la à jour dans storage.ts).

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e.postData || !e.postData.contents) {
        return errorResponse("No post data received");
    }

    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let data;

    switch (action) {
      // --- USERS ---
      case 'get_users':
        data = getSheetData(ss, 'Users');
        break;
      case 'save_user':
        data = appendRow(ss, 'Users', params.user, ['id', 'username', 'password', 'assignedSpot', 'isAdmin', 'status', 'passwordResetRequested']);
        break;
      case 'update_user':
        data = updateRow(ss, 'Users', params.user.id, params.user, ['id', 'username', 'password', 'assignedSpot', 'isAdmin', 'status', 'passwordResetRequested']);
        break;
      case 'delete_user':
        data = deleteRow(ss, 'Users', params.userId);
        break;
        
      // --- AVAILABILITIES ---
      case 'get_availabilities':
        // Ensure headers are up to date for Availabilities
        ensureHeaders(ss, 'Availabilities', ['id', 'providerId', 'providerUsername', 'spotNumber', 'startDate', 'endDate']);
        data = getSheetData(ss, 'Availabilities');
        break;
      case 'save_availability':
        data = appendRow(ss, 'Availabilities', params.availability, ['id', 'providerId', 'providerUsername', 'spotNumber', 'startDate', 'endDate']);
        break;
      case 'delete_availability':
        data = deleteRow(ss, 'Availabilities', params.id);
        break;

      // --- RESERVATIONS ---
      case 'get_reservations':
        // Ensure headers are up to date for Reservations (Fix for missing startDate/endDate)
        ensureHeaders(ss, 'Reservations', ['id', 'availabilityId', 'reserverId', 'reserverUsername', 'providerId', 'spotNumber', 'startDate', 'endDate', 'status']);
        data = getSheetData(ss, 'Reservations');
        break;
      case 'save_reservation':
        data = appendRow(ss, 'Reservations', params.reservation, ['id', 'availabilityId', 'reserverId', 'reserverUsername', 'providerId', 'spotNumber', 'startDate', 'endDate', 'status']);
        break;
      case 'update_reservation':
        data = updateRow(ss, 'Reservations', params.reservation.id, params.reservation, ['id', 'availabilityId', 'reserverId', 'reserverUsername', 'providerId', 'spotNumber', 'startDate', 'endDate', 'status']);
        break;

      default:
        return errorResponse("Unknown action: " + action);
    }

    return successResponse(data);

  } catch (e) {
    return errorResponse(e.toString());
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("SocPark Backend is Running. Use POST requests.");
}

// --- SETUP FUNCTION ---
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureHeaders(ss, 'Users', ['id', 'username', 'password', 'assignedSpot', 'isAdmin', 'status', 'passwordResetRequested']);
  ensureHeaders(ss, 'Availabilities', ['id', 'providerId', 'providerUsername', 'spotNumber', 'startDate', 'endDate']);
  ensureHeaders(ss, 'Reservations', ['id', 'availabilityId', 'reserverId', 'reserverUsername', 'providerId', 'spotNumber', 'startDate', 'endDate', 'status']);
}

// --- HELPER FUNCTIONS ---

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(ss, sheetName, requiredHeaders) {
  const sheet = getOrCreateSheet(ss, sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(requiredHeaders);
    return;
  }
  
  // Check if headers match. If not, update them.
  // This allows adding new columns without breaking the app.
  const currentHeadersRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1));
  const currentHeaders = currentHeadersRange.getValues()[0];
  
  // Simple check: if first required header is missing or mismatch in length/content
  // We rewrite the header row to ensure all keys are present for the frontend.
  // NOTE: This does not migrate data in columns, it just fixes keys for reading new data.
  const needsUpdate = requiredHeaders.some((h, i) => currentHeaders[i] !== h);
  
  if (needsUpdate) {
     sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  }
}

function getSheetData(ss, sheetName) {
  const sheet = getOrCreateSheet(ss, sheetName);
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return []; 

  // Read up to the last column containing data
  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = data.shift(); 
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      // Safety check for empty headers
      if (!header) return;
      
      let value = row[index];
      if (header === 'isAdmin' || header === 'passwordResetRequested') {
          value = (value === true || String(value).toLowerCase() === 'true');
      }
      if (value instanceof Date) {
        // FORCE GMT-10 (Hawaii) Timezone for output
        value = Utilities.formatDate(value, "GMT-10", "yyyy-MM-dd");
      }
      obj[header] = value;
    });
    return obj;
  });
}

function appendRow(ss, sheetName, item, headers) {
  const sheet = getOrCreateSheet(ss, sheetName);
  
  // Ensure headers exist before appending
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
      // Optional: Ensure headers match if we are appending
      // ensureHeaders(ss, sheetName, headers); 
      // (Skipped for performance in append, relied on read to fix)
  }

  const row = headers.map(header => {
    let val = item[header];
    if (val === undefined || val === null) return "";
    return val;
  });
  
  sheet.appendRow(row);
  return item;
}

function updateRow(ss, sheetName, id, item, headers) {
  const sheet = getOrCreateSheet(ss, sheetName);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const idIndex = headerRow.indexOf('id');
  
  if (idIndex === -1) throw new Error("Column 'id' missing in " + sheetName);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      const newRow = headers.map(header => {
         let val = item[header];
         if (val === undefined || val === null) return "";
         return val;
      });
      // We must write to the specific columns mapped by headers
      // Ideally we should find column indices for headers, but here we assume headers arg matches sheet structure
      // because we passed the same headers list.
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return item;
    }
  }
  throw new Error("Item with ID " + id + " not found in " + sheetName);
}

function deleteRow(ss, sheetName, id) {
  const sheet = getOrCreateSheet(ss, sheetName);
  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const idIndex = headerRow.indexOf('id');

  if (idIndex === -1) return false;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}