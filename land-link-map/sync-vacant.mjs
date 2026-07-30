import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ENV_FILE = new URL(".env.vacant.local", import.meta.url);
const GEOCODE_CACHE_FILE = new URL(".vacant-geocode-cache.json", import.meta.url);
const GREENDAERO_PAGE_URL = "https://www.greendaero.go.kr/svc/rfph/cpif/front/vacantlist.do";
const GREENDAERO_LIST_URL = "https://www.greendaero.go.kr/svc/rfph/cpif/getVacantHomePagingList.do";
const DEFAULT_GEOCODER_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const GEOCODER_USER_AGENT = "land-link-map/1.5 (personal family property map)";
const execFileAsync = promisify(execFile);

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

function vacantAddress(item) {
  const labelledAddress = String(item?.iemCn1 || "").split(":").slice(1).join(":");
  return String(item?.addr || item?.dongAddr || labelledAddress || `${item?.ctpvNm || ""} ${item?.sggNm || ""}`)
    .replace(/\s+/g, " ")
    .trim();
}

function validCoordinates(lat, lng) {
  return Number.isFinite(lat) && lat >= 30 && lat <= 44 && Number.isFinite(lng) && lng >= 123 && lng <= 132;
}

function geocoderProvider() {
  if (process.env.VACANT_GEOCODER_PROVIDER === "nominatim") return "nominatim";
  return process.env.KAKAO_REST_API_KEY ? "kakao" : "nominatim";
}

async function loadGeocodeCache() {
  try {
    const parsed = JSON.parse(await readFile(GEOCODE_CACHE_FILE, "utf8"));
    if (!parsed?.entries || typeof parsed.entries !== "object") return { version: 2, entries: {} };
    if (parsed.version === 1) {
      return { version: 2, entries: Object.fromEntries(Object.entries(parsed.entries).map(([address, result]) => [`nominatim:${address}`, result])) };
    }
    return { version: 2, entries: parsed.entries };
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) return { version: 2, entries: {} };
    throw error;
  }
}

async function saveGeocodeCache(cache) {
  await writeFile(GEOCODE_CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function geocodeAccuracy(result) {
  const type = String(result?.addresstype || result?.type || "");
  if (/house|building|residential/.test(type)) return "building";
  if (/road|street|highway/.test(type)) return "road";
  return "area";
}

async function fetchJson(url, headers) {
  try {
    const response = await fetchWithTimeout(url, { headers });
    if (!response.ok) throw new Error(`주소 좌표 변환 응답 오류 (${response.status})`);
    return response.json();
  } catch (error) {
    if (process.platform !== "win32" || !["SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE"].includes(error.cause?.code)) throw error;
    const headerArgs = Object.entries(headers).flatMap(([name, value]) => ["-H", `${name}: ${value}`]);
    const { stdout } = await execFileAsync("curl.exe", [
      "--ssl-no-revoke", "--silent", "--show-error", "--fail", "--max-time", "30",
      ...headerArgs,
      url.href
    ], { maxBuffer: 1_000_000 });
    return JSON.parse(stdout);
  }
}

async function geocodeAddress(address) {
  const provider = geocoderProvider();
  if (provider === "kakao") {
    const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
    url.search = new URLSearchParams({ query: address, analyze_type: "similar", size: "1" });
    const payload = await fetchJson(url, {
      Accept: "application/json",
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      "User-Agent": GEOCODER_USER_AGENT
    });
    const result = Array.isArray(payload?.documents) ? payload.documents[0] : null;
    const lat = Number(result?.y);
    const lng = Number(result?.x);
    if (!validCoordinates(lat, lng)) return { found: false, provider, checkedAt: new Date().toISOString() };
    return {
      found: true,
      provider,
      lat,
      lng,
      accuracy: "building",
      displayName: String(result.road_address?.address_name || result.address?.address_name || result.address_name || "").slice(0, 300),
      checkedAt: new Date().toISOString()
    };
  }

  const endpoint = String(process.env.VACANT_GEOCODER_URL || DEFAULT_GEOCODER_URL);
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ q: address, format: "jsonv2", countrycodes: "kr", limit: "1" });
  const results = await fetchJson(url, {
    Accept: "application/json",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "User-Agent": GEOCODER_USER_AGENT
  });
  const result = Array.isArray(results) ? results[0] : null;
  const lat = Number(result?.lat);
  const lng = Number(result?.lon);
  if (!validCoordinates(lat, lng)) return { found: false, provider, checkedAt: new Date().toISOString() };
  return {
    found: true,
    provider,
    lat,
    lng,
    accuracy: geocodeAccuracy(result),
    displayName: String(result.display_name || "").slice(0, 300),
    checkedAt: new Date().toISOString()
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function attachGeocodedCoordinates(items) {
  if (process.env.VACANT_GEOCODE_ENABLED === "false") {
    return { items, found: 0, reused: 0, missed: items.length, disabled: true };
  }

  const cache = await loadGeocodeCache();
  const provider = geocoderProvider();
  const delayMs = provider === "kakao"
    ? Math.max(100, Number(process.env.VACANT_GEOCODE_DELAY_MS) || 100)
    : Math.max(1_100, Number(process.env.VACANT_GEOCODE_DELAY_MS) || 1_100);
  let found = 0;
  let reused = 0;
  let missed = 0;
  let requested = 0;
  let failure = "";

  for (const [index, item] of items.entries()) {
    const address = vacantAddress(item);
    if (!address) {
      missed += 1;
      continue;
    }

    const cacheKey = `${provider}:${address}`;
    let result = cache.entries[cacheKey];
    if (result) {
      reused += 1;
    } else {
      try {
        result = await geocodeAddress(address);
      } catch (error) {
        console.warn(`주소 좌표 변환을 중단합니다: ${error.message}`);
        failure = error.message;
        missed += items.length - index;
        break;
      }
      cache.entries[cacheKey] = result;
      requested += 1;
      if (requested % 10 === 0 || index === items.length - 1) {
        await saveGeocodeCache(cache);
        console.log(`주소 좌표 확인 ${index + 1}/${items.length} · 새 조회 ${requested}건`);
      }
      await wait(delayMs);
    }

    if (result?.found && validCoordinates(Number(result.lat), Number(result.lng))) {
      item.geocodedLat = Number(result.lat);
      item.geocodedLng = Number(result.lng);
      item.geocodeAccuracy = result.accuracy || "area";
      item.geocodeProvider = result.provider || provider;
      found += 1;
    } else {
      missed += 1;
    }
  }

  if (requested % 10 !== 0) await saveGeocodeCache(cache);
  return { items, found, reused, missed, disabled: false, provider, failure };
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
  const localMode = process.argv.includes("--local");
  const baseUrl = String(localMode ? process.env.LOCAL_LANDLINK_URL || "http://127.0.0.1:4173" : process.env.LANDLINK_URL || "").replace(/\/+$/, "");
  const familyKey = String(process.env.FAMILY_ACCESS_KEY || "");
  if (!/^https:\/\//.test(baseUrl) && !(localMode && /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(baseUrl))) {
    throw new Error(localMode ? "LOCAL_LANDLINK_URL에 localhost 주소를 입력하세요." : "LANDLINK_URL에 https 배포 주소를 입력하세요.");
  }
  if (!familyKey && !localMode) throw new Error("FAMILY_ACCESS_KEY를 입력하세요.");
  const response = await fetchWithTimeout(`${baseUrl}/api/vacant-cache`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(familyKey ? { "X-Family-Access-Key": familyKey } : {}) },
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
  const writesListings = !process.argv.includes("--dry-run") && !process.argv.includes("--geocode-only");
  if (writesListings && !process.env.KAKAO_REST_API_KEY && !process.argv.includes("--allow-approximate")) {
    throw new Error("그린대로 전체 빈집 주소를 지도 좌표로 바꾸려면 .env.vacant.local에 KAKAO_REST_API_KEY를 입력하세요.");
  }
  console.log("그린대로에서 전국 거래 중 빈집을 확인합니다...");
  const items = await fetchVacantItems();
  if (process.argv.includes("--dry-run")) {
    console.log(`검증 완료: 전국 거래 중 빈집 ${items.length}건`);
    process.exitCode = 0;
  } else {
    console.log(`${items.length}건을 확인했습니다. 공개 주소의 지도 위치를 준비합니다...`);
    const located = await attachGeocodedCoordinates(items);
    console.log(`주소 좌표 ${located.found}건 확인 · 캐시 재사용 ${located.reused}건 · 미확인 ${located.missed}건 · ${located.provider === "kakao" ? "Kakao 상세 좌표" : "OpenStreetMap 근사 좌표"}`);
    if (located.failure && located.found === 0) {
      throw new Error(`주소 좌표를 한 건도 만들지 못해 기존 캐시를 유지합니다. ${located.failure}`);
    }
    if (process.argv.includes("--geocode-only")) {
      console.log("좌표 캐시 검증을 완료했습니다. 서버에는 업로드하지 않았습니다.");
    } else {
      console.log(process.argv.includes("--local") ? "로컬 빈집 캐시에 저장합니다..." : "Supabase 캐시에 저장합니다...");
      const result = await upload(located.items);
      console.log(`빈집 ${result.count}건 동기화 완료 · ${result.syncedAt}`);
    }
  }
} catch (error) {
  console.error(`동기화 실패: ${error.message}`);
  process.exitCode = 1;
}
