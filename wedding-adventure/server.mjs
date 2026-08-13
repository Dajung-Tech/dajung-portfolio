import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const uploadDirectory = join(root, 'uploads');
const port = Number(process.env.PORT) || 5174;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav'
};
const musicExtensions = new Set(['.mp3', '.m4a', '.ogg', '.wav']);
const photoExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

function readBody(request, limit = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { reject(new Error('파일은 10MB 이하만 업로드할 수 있어요.')); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function extractUploadedFile(body, boundary) {
  const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'));
  if (headerEnd === -1) return null;
  const headers = body.subarray(0, headerEnd).toString('utf8');
  const filename = headers.match(/filename="([^\"]+)"/i)?.[1] || '';
  const start = headerEnd + 4;
  const end = body.indexOf(Buffer.from(`\r\n--${boundary}`), start);
  if (end === -1 || !filename) return null;
  return { filename, data: body.subarray(start, end) };
}

async function uploadFile(request, response, kind) {
  const contentType = request.headers['content-type'] || '';
  const boundary = contentType.match(/boundary=([^;]+)/i)?.[1]?.replace(/^"|"$/g, '');
  if (!boundary) return sendJson(response, 400, { message: '올바른 업로드 요청이 아니에요.' });
  try {
    const uploaded = extractUploadedFile(await readBody(request), boundary);
    const extension = extname(uploaded?.filename || '').toLowerCase();
    const allowedExtensions = kind === 'music' ? musicExtensions : photoExtensions;
    const invalidMessage = kind === 'music' ? 'MP3, M4A, OGG, WAV 파일만 올릴 수 있어요.' : 'JPG, PNG, WEBP 사진만 올릴 수 있어요.';
    if (!uploaded || !allowedExtensions.has(extension) || uploaded.data.length === 0) {
      return sendJson(response, 400, { message: invalidMessage });
    }
    if (!existsSync(uploadDirectory)) mkdirSync(uploadDirectory, { recursive: true });
    const filename = `wedding-${kind}-${randomUUID()}${extension}`;
    writeFileSync(join(uploadDirectory, filename), uploaded.data, { flag: 'wx' });
    return sendJson(response, 201, { url: `/uploads/${filename}`, name: uploaded.filename });
  } catch (error) {
    return sendJson(response, 400, { message: error.message || '음악을 업로드하지 못했어요.' });
  }
}

createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (request.method === 'POST' && pathname === '/api/music') return uploadFile(request, response, 'music');
  if (request.method === 'POST' && pathname === '/api/photos') return uploadFile(request, response, 'photo');
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end('Method not allowed'); return; }
  const file = normalize(join(root, pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^[/\\]+/, '')));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (request.method === 'HEAD') { response.end(); return; }
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`Journey Wedding is running at http://localhost:${port}`));
