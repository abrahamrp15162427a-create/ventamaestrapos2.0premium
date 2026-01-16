const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

function ensureStoreFile() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify({ users: [], products: [], customers: [], inventoryMovements: [], sales: [] }, null, 2),
      'utf8'
    );
  }
}

function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    products: Array.isArray(parsed.products) ? parsed.products : [],
    customers: Array.isArray(parsed.customers) ? parsed.customers : [],
    inventoryMovements: Array.isArray(parsed.inventoryMovements) ? parsed.inventoryMovements : [],
    sales: Array.isArray(parsed.sales) ? parsed.sales : []
  };
}

let writeLock = Promise.resolve();

function writeStore(nextStore) {
  ensureStoreFile();
  writeLock = writeLock.then(() => {
    fs.writeFileSync(STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8');
  });
  return writeLock;
}

async function updateStore(mutator) {
  const current = readStore();
  const next = await mutator(current);
  await writeStore(next);
  return next;
}

module.exports = {
  readStore,
  writeStore,
  updateStore
};
