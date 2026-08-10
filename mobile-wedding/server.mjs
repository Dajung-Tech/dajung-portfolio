import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT) || 5173;
const root = process.cwd();
const dataDirectory = join(root, 'data');
const dataFile = join(dataDirectory, 'invitations.json');
const maxBodySize = 100 * 1024 * 1024;
const sessions = new Map();
const mimeTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' };
const allowedFields = ['groom', 'bride', 'date', 'openingLine', 'mainTitle', 'message', 'guestHeading', 'venue', 'address', 'transport', 'locationConfig', 'groomAccount', 'brideAccount', 'theme', 'heroPhoto', 'gallery', 'sections', 'design'];
const allowedSectionIds = new Set(['intro', 'gallery', 'location', 'account', 'rsvp']);

function ensureDataFile() {
  if (!existsSync(dataDirectory)) mkdirSync(dataDirectory, { recursive: true });
  if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify({ users: {}, invitations: {} }, null, 2));
}
function readStore() {
  ensureDataFile();
  try {
    const store = JSON.parse(readFileSync(dataFile, 'utf8'));
    return { users: store?.users || {}, invitations: store?.invitations || {} };
  } catch { return { users: {}, invitations: {} }; }
}
function writeStore(store) {
  ensureDataFile();
  const temporaryFile = `${dataFile}.tmp`;
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2));
  renameSync(temporaryFile, dataFile);
}
function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(payload));
}
function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    request.on('data', (chunk) => { size += chunk.length; if (size > maxBodySize) { reject(new Error('Payload too large')); request.destroy(); return; } chunks.push(chunk); });
    request.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    request.on('error', reject);
  });
}
function id(prefix) { return `${prefix}_${randomBytes(14).toString('base64url')}`; }
function parseCookies(request) { return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => { const [key, ...value] = part.trim().split('='); return [key, decodeURIComponent(value.join('='))]; })); }
function currentUser(request, store) { const userId = sessions.get(parseCookies(request).mm_session); return userId ? store.users[userId] : null; }
function publicUser(user) { return { id: user.id, email: user.email, name: user.name }; }
function sessionHeader(userId) { const token = id('sess'); sessions.set(token, userId); return { 'Set-Cookie': `mm_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` }; }
function clearSessionHeader(request) { sessions.delete(parseCookies(request).mm_session); return { 'Set-Cookie': 'mm_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' }; }
function passwordHash(password, salt = randomBytes(16).toString('hex')) { return { salt, hash: scryptSync(password, salt, 64).toString('hex') }; }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function sanitizeInvitation(input) {
  const invitation = {};
  for (const field of allowedFields) {
    if (field === 'gallery') invitation.gallery = Array.isArray(input.gallery) ? input.gallery.filter((image) => typeof image === 'string' && image.length < 7_000_000) : [];
    else if (field === 'locationConfig') invitation.locationConfig = { mode: ['map', 'text', 'transit'].includes(input.locationConfig?.mode) ? input.locationConfig.mode : 'map', mapNote: String(input.locationConfig?.mapNote || '').slice(0, 500), subway: String(input.locationConfig?.subway || '').slice(0, 500), bus: String(input.locationConfig?.bus || '').slice(0, 500) };
    else if (field === 'sections') invitation.sections = Array.isArray(input.sections) ? input.sections.filter((section, index, list) => allowedSectionIds.has(section?.id) && list.findIndex((item) => item?.id === section.id) === index).map((section) => ({ id: section.id, enabled: section.enabled !== false })) : [];
    else if (field === 'design') invitation.design = { font: ['myeongjo', 'modern', 'romantic'].includes(input.design?.font) ? input.design.font : 'myeongjo', textColor: /^#[0-9a-f]{6}$/i.test(input.design?.textColor) ? input.design.textColor : '#ffffff', layout: ['photo', 'editorial', 'minimal'].includes(input.design?.layout) ? input.design.layout : 'photo', align: ['left', 'center', 'right'].includes(input.design?.align) ? input.design.align : 'center', titlePosition: { x: Math.max(8, Math.min(92, Number(input.design?.titlePosition?.x) || 50)), y: Math.max(12, Math.min(88, Number(input.design?.titlePosition?.y) || 68)) } };
    else if (typeof input[field] === 'string') invitation[field] = input[field].slice(0, field === 'heroPhoto' ? 4_000_000 : 3_000);
  }
  return invitation;
}
function publicInvitation(invitation) { const { ownerId, rsvps, ...data } = invitation; return data; }

async function handleAuth(request, response, segments, store) {
  const action = segments[2];
  if (action === 'me' && request.method === 'GET') { const user = currentUser(request, store); if (!user) { sendJson(response, 401, { message: '로그인이 필요합니다.' }); return; } sendJson(response, 200, { user: publicUser(user) }); return; }
  if (action === 'logout' && request.method === 'POST') { sendJson(response, 200, { message: '로그아웃했습니다.' }, clearSessionHeader(request)); return; }
  const input = await readJsonBody(request);
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  if (action === 'register' && request.method === 'POST') {
    const name = String(input.name || '').trim().slice(0, 40);
    if (!name || !validEmail(email) || password.length < 8) { sendJson(response, 400, { message: '이름, 올바른 이메일, 8자 이상 비밀번호가 필요합니다.' }); return; }
    if (Object.values(store.users).some((user) => user.email === email)) { sendJson(response, 409, { message: '이미 가입된 이메일입니다.' }); return; }
    const userId = id('usr'); const secret = passwordHash(password); const user = { id: userId, name, email, passwordHash: secret.hash, passwordSalt: secret.salt, createdAt: new Date().toISOString() };
    store.users[userId] = user; writeStore(store); sendJson(response, 201, { user: publicUser(user) }, sessionHeader(userId)); return;
  }
  if (action === 'login' && request.method === 'POST') {
    const user = Object.values(store.users).find((item) => item.email === email);
    if (!user) { sendJson(response, 401, { message: '이메일 또는 비밀번호를 확인해 주세요.' }); return; }
    const candidate = scryptSync(password, user.passwordSalt, 64); const stored = Buffer.from(user.passwordHash, 'hex');
    if (candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) { sendJson(response, 401, { message: '이메일 또는 비밀번호를 확인해 주세요.' }); return; }
    sendJson(response, 200, { user: publicUser(user) }, sessionHeader(user.id)); return;
  }
  sendJson(response, 404, { message: '인증 요청을 찾을 수 없습니다.' });
}

async function handleApi(request, response, url) {
  const segments = url.pathname.split('/').filter(Boolean); const store = readStore();
  if (segments[1] === 'auth') { await handleAuth(request, response, segments, store); return; }
  if (segments[1] === 'public') {
    const publicId = segments[3]; const invitation = Object.values(store.invitations).find((item) => item.publicId === publicId);
    if (!invitation) { sendJson(response, 404, { message: '청첩장을 찾을 수 없습니다.' }); return; }
    if (segments[4] === 'rsvps' && request.method === 'POST') {
      const input = await readJsonBody(request); const name = String(input.name || '').trim().slice(0, 50); const attendance = input.attendance === 'declined' ? 'declined' : 'attending'; const guests = Math.max(1, Math.min(10, Number(input.guests) || 1));
      if (!name) { sendJson(response, 400, { message: '성함을 입력해 주세요.' }); return; }
      invitation.rsvps = Array.isArray(invitation.rsvps) ? invitation.rsvps : []; invitation.rsvps.push({ id: id('rsvp'), name, attendance, guests, createdAt: new Date().toISOString() }); invitation.updatedAt = new Date().toISOString(); writeStore(store); sendJson(response, 201, { message: '참석 여부가 전달되었습니다.' }); return;
    }
    if (request.method === 'GET') { sendJson(response, 200, publicInvitation(invitation)); return; }
    sendJson(response, 405, { message: '지원하지 않는 요청입니다.' }); return;
  }
  if (segments[1] !== 'invitations') { sendJson(response, 404, { message: 'API를 찾을 수 없습니다.' }); return; }
  const user = currentUser(request, store);
  if (!user) { sendJson(response, 401, { message: '로그인이 필요합니다.' }); return; }
  if (segments.length === 2 && request.method === 'GET') { const invitations = Object.values(store.invitations).filter((item) => item.ownerId === user.id).map(({ id: invitationId, publicId, groom, bride, date, updatedAt }) => ({ id: invitationId, publicId, groom, bride, date, updatedAt })); sendJson(response, 200, { invitations }); return; }
  if (segments.length === 2 && request.method === 'POST') { const data = sanitizeInvitation(await readJsonBody(request)); const now = new Date().toISOString(); const invitation = { id: id('inv'), publicId: id('w'), ownerId: user.id, ...data, rsvps: [], createdAt: now, updatedAt: now }; store.invitations[invitation.id] = invitation; writeStore(store); sendJson(response, 201, publicInvitation(invitation)); return; }
  const invitation = store.invitations[segments[2]];
  if (!invitation || invitation.ownerId !== user.id) { sendJson(response, 404, { message: '청첩장을 찾을 수 없습니다.' }); return; }
  if (request.method === 'GET') { sendJson(response, 200, invitation); return; }
  if (request.method === 'PUT') { const data = sanitizeInvitation(await readJsonBody(request)); Object.assign(invitation, data, { updatedAt: new Date().toISOString() }); writeStore(store); sendJson(response, 200, publicInvitation(invitation)); return; }
  sendJson(response, 405, { message: '지원하지 않는 요청입니다.' });
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) { await handleApi(request, response, url); return; }
    const relativePath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^[/\\]+/, ''); const filePath = normalize(join(root, decodeURIComponent(relativePath)));
    if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('404 Not Found'); return; }
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); createReadStream(filePath).pipe(response);
  } catch (error) { const status = error.message === 'Payload too large' ? 413 : 400; sendJson(response, status, { message: status === 413 ? '이미지 용량이 너무 큽니다.' : '요청을 처리할 수 없습니다.' }); }
}).listen(port, () => { ensureDataFile(); console.log(`Mobile Wedding is running at http://localhost:${port}`); console.log('Multi-user MVP API is ready. Stop with Ctrl+C.'); });
