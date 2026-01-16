const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function createUser({ email, password, name, plan }) {
  const emailNorm = normalizeEmail(email);
  if (!emailNorm || !emailNorm.includes('@')) throw new Error('Email inválido');
  if (!password || String(password).length < 6) throw new Error('Contraseña muy corta');

  const passwordHash = bcrypt.hashSync(String(password), 10);

  return {
    id: crypto.randomUUID(),
    email: emailNorm,
    name: String(name || 'Usuario').trim() || 'Usuario',
    plan: String(plan || 'De por vida'),
    passwordHash,
    createdAt: new Date().toISOString()
  };
}

function verifyPassword(user, password) {
  if (!user || !user.passwordHash) return false;
  return bcrypt.compareSync(String(password || ''), user.passwordHash);
}

module.exports = {
  normalizeEmail,
  createUser,
  verifyPassword
};
