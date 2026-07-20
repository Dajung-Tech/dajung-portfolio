import { readFile } from "node:fs/promises";

const ENV_FILE = new URL(".env.vacant.local", import.meta.url);
const GREENDAERO_PAGE_URL = "https://www.greendaero.go.kr/svc/rfph/cpif/front/vacantlist.do";
const GREENDAERO_LIST_URL = "https://www.greendaero.go.kr/svc/rfph/cpif/getVacantHomePagingList.do";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function loadEnvironment() {
  let text;
  try {
    text = await readFile(ENV_FILE, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" && process.argv.includes("--dry-run")) return;
    if (error.code === "ENOENT") throw new Error(".env.vacant.local 파일이 없습니다.");
    throw error;
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 30_000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
}

function setCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const combined = response.headers.get("set-cookie") || "";
  return combined ? combined.split(/,(?=\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+=)/) : [];
}

function collectCookies(jar, response) {
  for (const value of setCookieHeaders(response)) {
    const pair = value.split(";", 1)[0]?.trim() || "";
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function csrfToken(html, jar) {
  const raw = html.match(/<meta[^>]+name=["']_csrf["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']_csrf["']/i)?.[1]
    || html.match(/_G_CSRF_TOKEN\s*=\s*["']([^"']+)["']/)?.[1]
    || jar.get("XSRF-TOKEN")
    || "";
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function preview(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

async function createSession() {
  const jar = new Map();
  let currentUrl = GREENDAERO_PAGE_URL;
  let response;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    const cookies = cookieHeader(jar);
    response = await fetchWithTimeout(currentUrl, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "User-Agent": USER_AGENT,
        ...(cookies ? { Cookie: cookies } : {})
      }
    });
    collectCookies(jar, response);
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    break;
  }
  if (!response?.ok) throw new Error(`그린대로 페이지 응답 오류 (${response?.status || "연결 실패"})`);
  const html = await response.text();
  return { cookies: cookieHeader(jar), csrf: csrfToken(html, jar) };
}

async function fetchVacantItems() {
  const session = await createSession();
  const params = new URLSearchParams({ page: "1", itemsPerPage: "500", ctpvCd: "", sggCd: "", estateDlingTypeCd: "", completedYn: "N", searchText: "" });
  const response = await fetchWithTimeout(`${GREENDAERO_LIST_URL}?${params}`, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "ko-KR,ko;q=0.9",
      Referer: GREENDAERO_PAGE_URL,
      "User-Agent": USER_AGENT,
      "X-Requested-With": "XMLHttpRequest",
      ...(session.cookies ? { Cookie: session.cookies } : {}),
      ...(session.csrf ? { "X-XSRF-TOKEN": session.csrf } : {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`그린대로 목록 응답 오류 (${response.status}) · ${preview(text)}`);
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error(`그린대로가 JSON 대신 다른 응답을 반환했습니다. · ${preview(text)}`); }
  if (!Array.isArray(payload.list)) throw new Error("그린대로 응답에 빈집 목록이 없습니다.");
  return payload.list;
}

async function upload(items) {
  const baseUrl = String(process.env.LANDLINK_URL || "").replace(/\/+$/, "");
  const familyKey = String(process.env.FAMILY_ACCESS_KEY || "");
  if (!/^https:\/\//.test(baseUrl)) throw new Error("LANDLINK_URL에 https 배포 주소를 입력하세요.");
  if (!familyKey) throw new Error("FAMILY_ACCESS_KEY를 입력하세요.");
  const response = await fetchWithTimeout(`${baseUrl}/api/vacant-cache`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Family-Access-Key": familyKey },
    body: JSON.stringify({ items })
  });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error(`토지잇기 서버가 올바르지 않은 응답을 반환했습니다. (${response.status})`); }
  if (!response.ok) throw new Error(payload.error || `토지잇기 서버 업로드 오류 (${response.status})`);
  return payload;
}

try {
  await loadEnvironment();
  console.log("그린대로에서 전국 거래 중 빈집을 확인합니다...");
  const items = await fetchVacantItems();
  if (process.argv.includes("--dry-run")) {
    console.log(`검증 완료: 전국 거래 중 빈집 ${items.length}건`);
    process.exitCode = 0;
  } else {
    console.log(`${items.length}건을 확인했습니다. Supabase 캐시에 저장합니다...`);
    const result = await upload(items);
    console.log(`빈집 ${result.count}건 동기화 완료 · ${result.syncedAt}`);
  }
} catch (error) {
  console.error(`동기화 실패: ${error.message}`);
  process.exitCode = 1;
}
