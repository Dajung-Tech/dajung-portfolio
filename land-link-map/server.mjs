import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const root = process.cwd();
const FBO_PAGE_URL = "https://www.fbo.or.kr/gis/map.do?menuId=020080";
const FBO_GIS_URL = "https://www.fbo.or.kr/gis/selectReqFlndList.do";
const FBO_REGION_URL = "https://www.fbo.or.kr/gis/SelectLegalCode.do";
const GREENDAERO_PAGE_URL = "https://www.greendaero.go.kr/svc/rfph/cpif/front/vacantlist.do";
const GREENDAERO_LIST_URL = "https://www.greendaero.go.kr/svc/rfph/cpif/getVacantHomePagingList.do";
const GREENDAERO_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const HANBANG_REGION_URL = "http://www.karhanbang.com/office/ajax_combo_search.asp";
const HANBANG_SALE_URL = "https://www.karhanbang.com/sale/";
const syncMinutes = Math.max(15, Number(process.env.LIVE_SYNC_MINUTES) || 30);

const liveConfig = {
  farmlandEnabled: process.env.FARMLAND_SYNC_ENABLED !== "false",
  vacantHouseEnabled: process.env.VACANT_HOUSE_SYNC_ENABLED !== "false",
  defaultLegalCode: process.env.FARMLAND_LEGAL_CODE || "43",
  defaultRegionName: process.env.FARMLAND_REGION_NAME || "충청북도"
};

const sharedConfig = {
  supabaseUrl: String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
  supabaseKey: String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""),
  familyAccessKey: String(process.env.FAMILY_ACCESS_KEY || "")
};

const liveCaches = new Map();
const regionCache = new Map();
const externalLinkCache = new Map();
let vacantDiagnosticCache = null;
let vacantDiagnosticRefreshing = null;
const FALLBACK_SIDOS = [
  ["11", "서울특별시"], ["26", "부산광역시"], ["27", "대구광역시"], ["28", "인천광역시"],
  ["29", "광주광역시"], ["30", "대전광역시"], ["31", "울산광역시"], ["36", "세종특별자치시"],
  ["41", "경기도"], ["51", "강원특별자치도"], ["43", "충청북도"], ["44", "충청남도"],
  ["52", "전북특별자치도"], ["46", "전라남도"], ["47", "경상북도"], ["48", "경상남도"],
  ["50", "제주특별자치도"]
].map(([code, name]) => ({ code, name }));

const GREENDAERO_SIDO_CODES = {
  "11": "6110000", "26": "6260000", "27": "6270000", "28": "6280000", "29": "6290000",
  "30": "6300000", "31": "6310000", "36": "5690000", "41": "6410000", "51": "6420000",
  "43": "6430000", "44": "6440000", "52": "6450000", "46": "6460000", "47": "6470000",
  "48": "6480000", "50": "6500000"
};

const HANBANG_SIDO_CODES = {
  "11": "1", "41": "2", "28": "3", "26": "4", "27": "5", "29": "6", "46": "6",
  "30": "7", "31": "8", "51": "9", "48": "10", "47": "11", "52": "13", "44": "14",
  "43": "15", "36": "16", "50": "17"
};

const NAVER_SIDO_CENTERS = {
  "11": [37.5665, 126.9780], "26": [35.1796, 129.0756], "27": [35.8714, 128.6014], "28": [37.4563, 126.7052],
  "29": [35.1595, 126.8526], "30": [36.3504, 127.3845], "31": [35.5384, 129.3114], "36": [36.4800, 127.2890],
  "41": [37.4138, 127.5183], "51": [37.8228, 128.1555], "43": [36.8000, 127.7000], "44": [36.5184, 126.8000],
  "52": [35.7175, 127.1530], "46": [34.8679, 126.9910], "47": [36.4919, 128.8889], "48": [35.4606, 128.2132],
  "50": [33.4996, 126.5312]
};

const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml"
};

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  response.end(JSON.stringify(body));
}

function parseCookies(request) {
  return Object.fromEntries(String(request.headers.cookie || "").split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return null;
    const rawValue = part.slice(index + 1).trim();
    try { return [part.slice(0, index).trim(), decodeURIComponent(rawValue)]; } catch { return [part.slice(0, index).trim(), rawValue]; }
  }).filter(Boolean));
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

function databaseConfigured() {
  return Boolean(sharedConfig.supabaseUrl && sharedConfig.supabaseKey);
}

function authorizeFamilyRequest(request, response, url) {
  if (!sharedConfig.familyAccessKey || url.pathname === "/health") return true;
  const supplied = url.searchParams.get("access");
  if (supplied && secureEqual(supplied, sharedConfig.familyAccessKey)) {
    url.searchParams.delete("access");
    const secure = request.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
    response.writeHead(302, {
      Location: `${url.pathname}${url.search}${url.hash}`,
      "Set-Cookie": `landlink_access=${encodeURIComponent(sharedConfig.familyAccessKey)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    });
    response.end();
    return false;
  }
  if (secureEqual(request.headers["x-family-access-key"], sharedConfig.familyAccessKey)) return true;
  if (secureEqual(parseCookies(request).landlink_access, sharedConfig.familyAccessKey)) return true;
  if (url.pathname.startsWith("/api/")) {
    json(response, 403, { error: "가족 공유 링크를 통해 접속해 주세요." });
  } else {
    response.writeHead(403, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    response.end("<!doctype html><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>토지잇기</title><style>body{font-family:system-ui;margin:0;display:grid;place-items:center;min-height:100vh;background:#f4f7f5;color:#263a31}.card{max-width:420px;margin:24px;padding:28px;border:1px solid #dce6e0;border-radius:16px;background:white;text-align:center}p{color:#65736c;line-height:1.7}</style><div class=\"card\"><h1>가족 공유 링크가 필요합니다</h1><p>전달받은 전체 주소를 다시 열어 주세요.<br>별도의 로그인은 필요하지 않습니다.</p></div>");
  }
  return false;
}

async function readRequestJson(request, limit = 100_000) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > limit) throw new Error("요청 데이터가 너무 큽니다.");
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new Error("JSON 요청 형식이 올바르지 않습니다.");
  }
}

async function supabaseRequest(path, { method = "GET", body, prefer = "" } = {}) {
  if (!databaseConfigured()) throw new Error("공용 데이터베이스가 설정되지 않았습니다.");
  const legacyJwtKey = sharedConfig.supabaseKey.startsWith("eyJ") || sharedConfig.supabaseKey.split(".").length === 3;
  const response = await fetchWithTimeout(`${sharedConfig.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: sharedConfig.supabaseKey,
      ...(legacyJwtKey ? { Authorization: `Bearer ${sharedConfig.supabaseKey}` } : {}),
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  }, 20_000);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`공용 데이터베이스 응답 오류 (${response.status})${detail ? ` · ${detail.slice(0, 180)}` : ""}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function fetchWithTimeout(url, options = {}, timeout = 15_000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
}

async function fboFetch(url, options = {}) {
  return fetchWithTimeout(url, {
    ...options,
    headers: { Referer: FBO_PAGE_URL, "User-Agent": "land-link-map/1.3 (low-frequency personal sync)", ...(options.headers || {}) }
  });
}

async function postFboJson(url, body) {
  const response = await fboFetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`농지은행 응답 오류 (${response.status})`);
  return response.json();
}

async function fetchSidoRegions() {
  const response = await fboFetch(FBO_PAGE_URL);
  if (!response.ok) throw new Error(`농지은행 지역 목록 응답 오류 (${response.status})`);
  const html = await response.text();
  const select = html.match(/<select[^>]+id=["']schSidoCd["'][\s\S]*?<\/select>/i)?.[0] || "";
  const regions = [...select.matchAll(/<option[^>]+>/gi)].map(([tag]) => {
    const code = tag.match(/value=["'](\d+)["']/i)?.[1];
    const name = tag.match(/label=["']([^"']+)["']/i)?.[1];
    return code && name ? { code, name } : null;
  }).filter(Boolean);
  return regions.length ? regions : FALLBACK_SIDOS;
}

async function fetchChildRegions(level, parent) {
  const payload = await postFboJson(FBO_REGION_URL, { type: level === "sigungu" ? "sido" : "eupmyon", code: parent });
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  return rows.map((row) => level === "sigungu"
    ? { code: String(row.siguncd || ""), name: String(row.sigunnm || "") }
    : { code: String(row.eupmyoncd || ""), name: String(row.eupmyonnm || "") }
  ).filter((item) => item.code && item.name);
}

async function getRegions(level, parent = "") {
  if (!new Set(["sido", "sigungu", "eupmyeondong"]).has(level)) throw new Error("지원하지 않는 지역 단계입니다.");
  if (level === "sigungu" && !/^\d{2}$/.test(parent)) throw new Error("시도 코드를 확인해 주세요.");
  if (level === "eupmyeondong" && !/^\d{5}$/.test(parent)) throw new Error("시군구 코드를 확인해 주세요.");
  const key = `${level}:${parent}`;
  const cached = regionCache.get(key);
  if (cached && Date.now() - cached.savedAt < 24 * 60 * 60_000) return cached.regions;
  const regions = level === "sido" ? await fetchSidoRegions() : await fetchChildRegions(level, parent);
  regionCache.set(key, { regions, savedAt: Date.now() });
  return regions;
}

function farmlandRequest(legalCode) {
  return {
    currentPageNo: "1", schBizTp: "A", flndStock: "N", facility: "N", flndRent: "N",
    schSidoCd: legalCode.slice(0, 2), schSigunCd: legalCode.length >= 5 ? legalCode.slice(0, 5) : "",
    schEupmyonCd: legalCode.length === 8 ? legalCode : "", schAmtMin: "", schAmtMax: "", schAreaMin: "", schAreaMax: "",
    schLndcgrCList: ["D03080200", "D03080100", "D03080300", "NH", "DRT"],
    schBizclidList: [], schDrtLndcgrCList: [], schLegalId: legalCode
  };
}

function farmlandCategory(code) {
  return ({ D03080100: "전", D03080200: "답", D03080300: "과수원" })[code] || "농지";
}

function normalizeFarmland(item, regionName) {
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (!item.pnu || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const dealType = item.bizclidType === "DRT" || String(item.bizClNm || "").includes("매도") ? "sale" : "lease";
  const period = [item.begin_dt, item.end_dt].filter(Boolean).join(" ~ ");
  return {
    id: `fbo-${item.reqId || "listing"}-${item.pnu}`, externalId: String(item.reqId || item.pnu),
    managedBy: "farmland-live", source: "farmland", propertyType: "farmland", dealType,
    title: `농지은행 ${item.bizClNm || (dealType === "sale" ? "매도" : "임대")} · ${item.addr || regionName}`,
    address: String(item.addr || regionName), lat, lng, price: (Number(item.hope_amt) || 0) / 10_000,
    area: Number(item.area) || 0, landCategory: farmlandCategory(item.real_lndcgr_c), url: FBO_PAGE_URL,
    memo: ["농지은행 공식 GIS 동기화 매물", period ? `공고기간 ${period}` : "", item.reqId ? `신청번호 ${item.reqId}` : ""].filter(Boolean).join("\n"),
    verifiedAt: new Date().toISOString().slice(0, 10), syncedAt: new Date().toISOString(), readOnly: true
  };
}

async function fetchFarmlandListings(legalCode, regionName) {
  if (!liveConfig.farmlandEnabled) return { listings: [], status: "disabled", message: "환경설정에서 비활성화됨" };
  const payload = await postFboJson(FBO_GIS_URL, farmlandRequest(legalCode));
  const listings = (Array.isArray(payload.resultList) ? payload.resultList : []).map((item) => normalizeFarmland(item, regionName)).filter(Boolean);
  return { listings, status: "connected", message: `${regionName} ${listings.length}건` };
}

function maskedAddress(value) {
  return String(value || "").replace(/\d/g, "*").replace(/\s+/g, " ").trim();
}

function regionMatches(item, regionName) {
  const parts = String(regionName || "").split(/\s+/).filter(Boolean).slice(1);
  if (!parts.length) return true;
  const address = `${item.addr || ""} ${item.dongAddr || ""} ${item.ctpvNm || ""} ${item.sggNm || ""}`;
  return parts.every((part) => address.includes(part));
}

function greenDealType(code) {
  return code === "01" ? "sale" : "lease";
}

function setCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
  const combined = response.headers.get("set-cookie") || "";
  return combined ? combined.split(/,(?=\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+=)/) : [];
}

function collectResponseCookies(jar, response) {
  for (const value of setCookieHeaders(response)) {
    const pair = value.split(";", 1)[0]?.trim() || "";
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}

function cookieJarHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function greendaeroCsrfToken(html) {
  return html.match(/<meta[^>]+name=["']_csrf["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']_csrf["']/i)?.[1]
    || html.match(/_G_CSRF_TOKEN\s*=\s*["']([^"']+)["']/)?.[1]
    || "";
}

async function createGreendaeroSession() {
  const jar = new Map();
  let currentUrl = GREENDAERO_PAGE_URL;
  let response;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    const cookies = cookieJarHeader(jar);
    response = await fetchWithTimeout(currentUrl, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "User-Agent": GREENDAERO_USER_AGENT,
        ...(cookies ? { Cookie: cookies } : {})
      }
    }, 20_000);
    collectResponseCookies(jar, response);
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    break;
  }
  if (!response || !response.ok) throw new Error(`농촌빈집은행 세션 응답 오류 (${response?.status || "연결 실패"})`);
  const html = await response.text();
  const cookieToken = jar.get("XSRF-TOKEN") || "";
  let csrfToken = greendaeroCsrfToken(html) || cookieToken;
  try { csrfToken = decodeURIComponent(csrfToken); } catch { /* 원문 토큰 사용 */ }
  return {
    csrfToken,
    cookies: cookieJarHeader(jar),
    diagnostics: `페이지 ${response.status} · CSRF ${csrfToken ? "확인" : "없음"} · 쿠키 ${jar.size}개${responsePreview(html) ? ` · ${responsePreview(html)}` : ""}`
  };
}

function responsePreview(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

async function requestVacantHousePayload(params) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const session = await createGreendaeroSession();
      const response = await fetchWithTimeout(`${GREENDAERO_LIST_URL}?${params}`, {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          Referer: GREENDAERO_PAGE_URL,
          "User-Agent": GREENDAERO_USER_AGENT,
          "X-Requested-With": "XMLHttpRequest",
          ...(session.cookies ? { Cookie: session.cookies } : {}),
          ...(session.csrfToken ? { "X-XSRF-TOKEN": session.csrfToken } : {})
        }
      }, 20_000);
      const text = await response.text();
      if (!response.ok) throw new Error(`농촌빈집은행 응답 오류 (${response.status})${responsePreview(text) ? ` · ${responsePreview(text)}` : ""}`);
      try {
        const payload = JSON.parse(text);
        if (!Array.isArray(payload.list)) throw new Error("목록 필드가 없습니다.");
        return payload;
      } catch (error) {
        throw new Error(`농촌빈집은행이 JSON 대신 다른 응답을 반환했습니다.${responsePreview(text) ? ` · ${responsePreview(text)}` : ""} · ${session.diagnostics}`);
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function normalizeVacantHouse(item) {
  const address = maskedAddress(item.iemCn1?.split(":").slice(1).join(":") || `${item.ctpvNm || ""} ${item.sggNm || ""}`);
  const features = String(item.iemCn5 || "").replace(/^\s*매물특징\s*:\s*/, "").trim();
  return {
    id: `greendaero-${item.bbscttSn}`, externalId: String(item.bbscttSn || ""), managedBy: "vacant-house-live",
    source: "vacant", propertyType: "house", dealType: greenDealType(item.estateDlingTypeCd),
    title: String(item.pstTtlNm || "농촌 빈집은행 매물"), address: address || `${item.ctpvNm || ""} ${item.sggNm || ""}`.trim(),
    lat: null, lng: null, price: Number(item.grnteAmt) || 0, area: Number(item.areaSize) || 0,
    landCategory: "농촌주택", url: `${GREENDAERO_PAGE_URL.replace("vacantlist", "vacantdetail")}?bbscttSn=${encodeURIComponent(item.bbscttSn)}`,
    memo: ["그린대로 농촌빈집은행 공개 매물", features, item.aditCnIemNm1 ? `연계 플랫폼: ${item.aditCnIemNm1}` : "", "공식 목록에 좌표가 없어 지도 마커는 표시되지 않습니다."].filter(Boolean).join("\n"),
    verifiedAt: String(item.lastMdfcnDt || item.frstRegDt || new Date().toISOString()).slice(0, 10), syncedAt: new Date().toISOString(), readOnly: true
  };
}

async function fetchVacantHouseListings(legalCode, regionName) {
  if (!liveConfig.vacantHouseEnabled) return { listings: [], status: "disabled", message: "환경설정에서 비활성화됨" };
  const cached = await getVacantCache();
  if (cached) {
    const listings = cached.listings.filter((listing) => cachedVacantRegionMatches(listing, regionName));
    const synced = new Date(cached.syncedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" });
    return { listings, status: "connected", message: `${regionName} ${listings.length}건 · PC 동기화 ${synced}` };
  }
  const ctpvCd = GREENDAERO_SIDO_CODES[legalCode.slice(0, 2)];
  if (!ctpvCd) return { listings: [], status: "unsupported", message: "해당 시도는 농촌빈집은행 조회 대상이 아닙니다." };
  const params = new URLSearchParams({ page: "1", itemsPerPage: "500", ctpvCd, sggCd: "", estateDlingTypeCd: "", completedYn: "N", searchText: "" });
  const payload = await requestVacantHousePayload(params);
  const listings = (Array.isArray(payload.list) ? payload.list : []).filter((item) => regionMatches(item, regionName)).map(normalizeVacantHouse);
  return { listings, status: "connected", message: `${regionName} ${listings.length}건 · 좌표 미제공` };
}

function cachedVacantRegionMatches(listing, regionName) {
  const parts = String(regionName || "").split(/\s+/).filter(Boolean);
  const address = String(listing?.address || "");
  return parts.every((part) => address.includes(part));
}

async function vacantDiagnostic() {
  if (vacantDiagnosticCache && Date.now() - vacantDiagnosticCache.checkedAt < 5 * 60_000) return vacantDiagnosticCache;
  if (vacantDiagnosticRefreshing) return vacantDiagnosticRefreshing;
  vacantDiagnosticRefreshing = (async () => {
    try {
      const result = await fetchVacantHouseListings(liveConfig.defaultLegalCode, liveConfig.defaultRegionName);
      vacantDiagnosticCache = {
        ok: result.status === "connected",
        status: result.status,
        message: result.message,
        count: result.listings.length,
        checkedAt: Date.now()
      };
    } catch (error) {
      vacantDiagnosticCache = {
        ok: false,
        status: "error",
        message: error.message || "농촌빈집은행 연결 실패",
        count: 0,
        checkedAt: Date.now()
      };
    }
    return vacantDiagnosticCache;
  })().finally(() => { vacantDiagnosticRefreshing = null; });
  return vacantDiagnosticRefreshing;
}

function connectors(legalCode, regionName) {
  return [
    { key: "farmland", run: () => fetchFarmlandListings(legalCode, regionName) },
    { key: "vacant", run: () => fetchVacantHouseListings(legalCode, regionName) }
  ];
}

function getLiveCache(legalCode, regionName) {
  const key = `${legalCode}:${regionName}`;
  if (!liveCaches.has(key)) liveCaches.set(key, { bySource: {}, listings: [], sources: {}, updatedAt: null, refreshing: null, legalCode, regionName });
  return liveCaches.get(key);
}

function isFresh(cache) {
  return cache.updatedAt && Date.now() - new Date(cache.updatedAt).getTime() < syncMinutes * 60_000;
}

async function refreshLiveListings({ force = false, legalCode, regionName }) {
  const cache = getLiveCache(legalCode, regionName);
  if (!force && isFresh(cache)) return cache;
  if (force && cache.updatedAt && Date.now() - new Date(cache.updatedAt).getTime() < 60_000) return cache;
  if (cache.refreshing) return cache.refreshing;
  cache.refreshing = (async () => {
    for (const connector of connectors(legalCode, regionName)) {
      try {
        const result = await connector.run();
        cache.bySource[connector.key] = result.listings;
        cache.sources[connector.key] = { status: result.status, message: result.message, count: result.listings.length };
      } catch (error) {
        const kept = cache.bySource[connector.key] || [];
        cache.sources[connector.key] = { status: "error", message: `${error.message}${kept.length ? " · 이전 데이터 유지" : ""}`, count: kept.length };
      }
    }
    cache.listings = Object.values(cache.bySource).flat();
    cache.updatedAt = new Date().toISOString();
    return cache;
  })().finally(() => { cache.refreshing = null; });
  return cache.refreshing;
}

function livePayload(cache) {
  return { listings: cache.listings, updatedAt: cache.updatedAt, sources: cache.sources, cacheMinutes: syncMinutes, region: cache.regionName, legalCode: cache.legalCode };
}

function validSharedId(value) {
  const id = String(value || "").trim();
  if (!/^[a-zA-Z0-9._:-]{1,160}$/.test(id)) throw new Error("공유 항목 ID가 올바르지 않습니다.");
  return id;
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeSharedProperty(raw, expectedId) {
  const id = validSharedId(expectedId || raw?.id);
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  const title = cleanText(raw?.title, 80);
  const address = cleanText(raw?.address, 120);
  if (!title || !address || !Number.isFinite(lat) || lat < 30 || lat > 44 || !Number.isFinite(lng) || lng < 123 || lng > 132) {
    throw new Error("공유 매물의 필수 항목이나 좌표가 올바르지 않습니다.");
  }
  let propertyUrl = "";
  try {
    const parsed = new URL(String(raw?.url || ""));
    if (["http:", "https:"].includes(parsed.protocol)) propertyUrl = parsed.href;
  } catch {}
  return {
    id, source: "personal",
    propertyType: ["land", "house", "farmland"].includes(raw?.propertyType) ? raw.propertyType : "land",
    dealType: raw?.dealType === "lease" ? "lease" : "sale",
    title, address, lat, lng,
    price: Math.max(0, Number(raw?.price) || 0), area: Math.max(0, Number(raw?.area) || 0),
    landCategory: cleanText(raw?.landCategory, 20), url: propertyUrl, memo: cleanText(raw?.memo, 1000),
    verifiedAt: /^\d{4}-\d{2}-\d{2}$/.test(String(raw?.verifiedAt || "")) ? String(raw.verifiedAt) : new Date().toISOString().slice(0, 10),
    externalId: "", managedBy: "", syncedAt: "", readOnly: false
  };
}

async function getSharedData() {
  if (!databaseConfigured()) return { configured: false, properties: [], listingStates: {} };
  const [propertyRows, stateRows] = await Promise.all([
    supabaseRequest("family_properties?select=payload&order=updated_at.desc"),
    supabaseRequest("family_listing_states?select=listing_id,favorite,memo,updated_at")
  ]);
  const properties = (Array.isArray(propertyRows) ? propertyRows : []).map((row) => {
    try { return normalizeSharedProperty(row.payload); } catch { return null; }
  }).filter(Boolean);
  const listingStates = Object.fromEntries((Array.isArray(stateRows) ? stateRows : []).map((row) => [String(row.listing_id), {
    favorite: Boolean(row.favorite), memo: cleanText(row.memo, 1000), updatedAt: String(row.updated_at || "")
  }]));
  return { configured: true, properties, listingStates };
}

function normalizeCachedVacantListing(raw) {
  if (!raw || raw.source !== "vacant" || raw.managedBy !== "vacant-house-live") return null;
  const id = String(raw.id || "");
  const title = cleanText(raw.title, 120);
  const address = cleanText(raw.address, 180);
  if (!/^greendaero-\d+$/.test(id) || !title || !address) return null;
  let propertyUrl = "";
  try {
    const parsed = new URL(String(raw.url || ""));
    if (parsed.protocol === "https:" && parsed.hostname === "www.greendaero.go.kr") propertyUrl = parsed.href;
  } catch {}
  return {
    id,
    externalId: cleanText(raw.externalId, 80),
    managedBy: "vacant-house-live",
    source: "vacant",
    propertyType: "house",
    dealType: raw.dealType === "lease" ? "lease" : "sale",
    title,
    address,
    lat: null,
    lng: null,
    price: Math.max(0, Number(raw.price) || 0),
    area: Math.max(0, Number(raw.area) || 0),
    landCategory: "농촌주택",
    url: propertyUrl,
    memo: cleanText(raw.memo, 2000),
    verifiedAt: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.verifiedAt || "")) ? String(raw.verifiedAt) : new Date().toISOString().slice(0, 10),
    syncedAt: String(raw.syncedAt || ""),
    readOnly: true
  };
}

async function getVacantCache() {
  if (!databaseConfigured()) return null;
  try {
    const rows = await supabaseRequest("family_external_caches?source=eq.vacant&select=payload,synced_at&limit=1");
    const row = Array.isArray(rows) ? rows[0] : null;
    const listings = (Array.isArray(row?.payload?.listings) ? row.payload.listings : []).map(normalizeCachedVacantListing).filter(Boolean);
    return row && listings.length ? { listings, syncedAt: String(row.synced_at || "") } : null;
  } catch (error) {
    if (/family_external_caches|42P01/.test(error.message || "")) return null;
    throw error;
  }
}

async function saveVacantCache(items) {
  if (!Array.isArray(items) || items.length > 1000) throw new Error("빈집 원본 목록 형식이 올바르지 않습니다.");
  const listings = items.map(normalizeVacantHouse).map(normalizeCachedVacantListing).filter(Boolean);
  if (!listings.length) throw new Error("저장할 유효한 빈집 매물이 없습니다.");
  const syncedAt = new Date().toISOString();
  await supabaseRequest("family_external_caches?on_conflict=source", {
    method: "POST",
    body: { source: "vacant", payload: { listings }, synced_at: syncedAt },
    prefer: "resolution=merge-duplicates,return=minimal"
  });
  for (const cache of liveCaches.values()) {
    delete cache.bySource.vacant;
    delete cache.sources.vacant;
    cache.listings = Object.values(cache.bySource).flat();
    cache.updatedAt = null;
  }
  vacantDiagnosticCache = null;
  return { count: listings.length, syncedAt };
}

async function upsertSharedProperty(id, raw) {
  const property = normalizeSharedProperty(raw, id);
  await supabaseRequest("family_properties?on_conflict=id", {
    method: "POST", body: { id: property.id, payload: property, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal"
  });
  return property;
}

async function deleteSharedProperty(id) {
  const safeId = validSharedId(id);
  await Promise.all([
    supabaseRequest(`family_properties?id=eq.${encodeURIComponent(safeId)}`, { method: "DELETE" }),
    supabaseRequest(`family_listing_states?listing_id=eq.${encodeURIComponent(safeId)}`, { method: "DELETE" })
  ]);
}

async function upsertListingState(id, raw) {
  const listingId = validSharedId(id);
  const listingState = { favorite: Boolean(raw?.favorite), memo: cleanText(raw?.memo, 1000), updatedAt: new Date().toISOString() };
  await supabaseRequest("family_listing_states?on_conflict=listing_id", {
    method: "POST",
    body: { listing_id: listingId, favorite: listingState.favorite, memo: listingState.memo, updated_at: listingState.updatedAt },
    prefer: "resolution=merge-duplicates,return=minimal"
  });
  return listingState;
}

function requestedRegion(url) {
  const legalCode = url.searchParams.get("legalCode") || liveConfig.defaultLegalCode;
  const regionName = (url.searchParams.get("regionName") || liveConfig.defaultRegionName).trim().slice(0, 80);
  if (!/^(?:\d{2}|\d{5}|\d{8})$/.test(legalCode)) throw new Error("시도, 시군구 또는 읍면동 지역 코드가 올바르지 않습니다.");
  return { legalCode, regionName: regionName || liveConfig.defaultRegionName };
}

function comparableRegionName(value) {
  return String(value || "").normalize("NFKC").replace(/\([^)]*\)/g, "").replace(/\s+/g, "").trim();
}

function matchingRegion(options, name) {
  const target = comparableRegionName(name);
  if (!target) return null;
  return options.find((option) => comparableRegionName(option.name) === target)
    || options.find((option) => comparableRegionName(option.name).includes(target) || target.includes(comparableRegionName(option.name)))
    || null;
}

async function hanbangRegions(flag, sido, gugun = "") {
  const body = new URLSearchParams({ flag, sel_sido: sido, sel_gugun: gugun, sel_dong: "" });
  const response = await fetchWithTimeout(HANBANG_REGION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: HANBANG_SALE_URL,
      "User-Agent": "land-link-map/1.4 (official-region-link)"
    },
    body
  }, 15_000);
  if (!response.ok) throw new Error(`한방 지역 조회 오류 (${response.status})`);
  const payload = await response.json();
  const codes = Array.isArray(payload.datMM?.code) ? payload.datMM.code : [];
  const names = Array.isArray(payload.datMM?.name) ? payload.datMM.name : [];
  return codes.map((code, index) => ({ code: String(code), name: String(names[index] || "") })).filter((item) => item.code && item.name);
}

async function fboRegionName(level, parent, code) {
  const regions = await getRegions(level, parent);
  return regions.find((region) => region.code === code)?.name || "";
}

async function createHanbangLink(legalCode, regionName) {
  const sido = HANBANG_SIDO_CODES[legalCode.slice(0, 2)];
  if (!sido) return { supported: false, url: HANBANG_SALE_URL, message: "한방에서 이 시·도 지역 연결을 지원하지 않습니다." };

  let gugun = "";
  let dong = "";
  let appliedRegion = regionName.split(/\s+/)[0] || regionName;
  let limited = false;

  if (legalCode.length >= 5) {
    const sigunguCode = legalCode.slice(0, 5);
    const localName = await fboRegionName("sigungu", legalCode.slice(0, 2), sigunguCode);
    const match = matchingRegion(await hanbangRegions("S", sido), localName);
    if (match) {
      gugun = match.code;
      appliedRegion = `${appliedRegion} ${localName}`.trim();
    } else {
      limited = true;
    }
  }

  if (legalCode.length === 8 && gugun) {
    const localName = await fboRegionName("eupmyeondong", legalCode.slice(0, 5), legalCode);
    const match = matchingRegion(await hanbangRegions("G", sido, gugun), localName);
    if (match) {
      dong = match.code;
      appliedRegion = `${appliedRegion} ${localName}`.trim();
    } else {
      limited = true;
    }
  }

  return {
    supported: true,
    method: "POST",
    url: `${HANBANG_SALE_URL}?topM=05`,
    fields: { search: "", sel_sido: sido, sel_gugun: gugun, sel_dong: dong, SDT: "", EDT: "" },
    message: limited ? `${appliedRegion}까지 적용 (하위 지역 미지원)` : `${appliedRegion} 매물로 바로 이동`
  };
}

function naverRegionCenter(legalCode, regionName) {
  const cached = liveCaches.get(`${legalCode}:${regionName}`);
  const coordinates = (cached?.bySource?.farmland || [])
    .filter((listing) => Number.isFinite(listing.lat) && Number.isFinite(listing.lng))
    .map((listing) => [listing.lat, listing.lng]);
  if (coordinates.length) {
    const lats = coordinates.map(([lat]) => lat);
    const lngs = coordinates.map(([, lng]) => lng);
    return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  }
  return NAVER_SIDO_CENTERS[legalCode.slice(0, 2)] || [36.5, 127.8];
}

function createNaverLink(legalCode, regionName) {
  const [lat, lng] = naverRegionCenter(legalCode, regionName);
  const zoom = legalCode.length === 2 ? 9 : legalCode.length === 5 ? 12 : 14;
  const params = new URLSearchParams({
    ms: `${lat.toFixed(6)},${lng.toFixed(6)},${zoom}`,
    a: "DDDGG:VL",
    b: "A1",
    e: "RETAIL"
  });
  return {
    supported: true,
    method: "GET",
    url: `https://new.land.naver.com/houses?${params}`,
    message: `${regionName} 중심 · 주택 매매만 보기`
  };
}

async function externalProviders(legalCode, regionName) {
  const key = `${legalCode}:${regionName}`;
  const cached = externalLinkCache.get(key);
  if (cached && Date.now() - cached.savedAt < 24 * 60 * 60_000) return { ...cached.providers, naver: createNaverLink(legalCode, regionName) };

  let hanbang;
  try {
    hanbang = await createHanbangLink(legalCode, regionName);
  } catch (error) {
    hanbang = { supported: false, url: HANBANG_SALE_URL, message: `지역 연결 실패 · ${error.message}` };
  }
  const ddangyaCode = legalCode.replace(/^42/, "51").replace(/^45/, "52");
  const providers = {
    naver: createNaverLink(legalCode, regionName),
    disco: { supported: false, url: "https://disco.re/", message: "공식 지역 딥링크를 제공하지 않습니다." },
    hanbang,
    ddangya: { supported: true, method: "GET", url: `https://ddangya.com/list?code=${encodeURIComponent(ddangyaCode)}`, message: `${regionName} 매물로 바로 이동` },
    valuemap: { supported: false, url: "https://www.valueupmap.com/", message: "공식 지역 딥링크를 제공하지 않습니다." }
  };
  externalLinkCache.set(key, { providers, savedAt: Date.now() });
  return providers;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (!authorizeFamilyRequest(request, response, url)) return;
    if (url.pathname === "/health" && request.method === "GET") {
      if (url.searchParams.get("upstream") === "vacant") {
        const diagnostic = await vacantDiagnostic();
        json(response, diagnostic.ok ? 200 : 503, { ...diagnostic, checkedAt: new Date(diagnostic.checkedAt).toISOString() });
        return;
      }
      json(response, 200, { ok: true, database: databaseConfigured() });
      return;
    }
    if (url.pathname === "/api/shared-data" && request.method === "GET") {
      json(response, 200, await getSharedData());
      return;
    }
    if (url.pathname === "/api/vacant-cache" && request.method === "PUT") {
      const body = await readRequestJson(request, 2_000_000);
      json(response, 200, { ok: true, ...(await saveVacantCache(body.items)) });
      return;
    }
    const sharedPropertyMatch = url.pathname.match(/^\/api\/shared-properties\/([^/]+)$/);
    if (sharedPropertyMatch && request.method === "PUT") {
      const id = decodeURIComponent(sharedPropertyMatch[1]);
      json(response, 200, { property: await upsertSharedProperty(id, await readRequestJson(request)) });
      return;
    }
    if (sharedPropertyMatch && request.method === "DELETE") {
      await deleteSharedProperty(decodeURIComponent(sharedPropertyMatch[1]));
      json(response, 200, { ok: true });
      return;
    }
    const listingStateMatch = url.pathname.match(/^\/api\/listing-states\/([^/]+)$/);
    if (listingStateMatch && request.method === "PUT") {
      const id = decodeURIComponent(listingStateMatch[1]);
      json(response, 200, { listingState: await upsertListingState(id, await readRequestJson(request)) });
      return;
    }
    if (url.pathname === "/api/farmland/regions" && request.method === "GET") {
      json(response, 200, { regions: await getRegions(url.searchParams.get("level") || "sido", url.searchParams.get("parent") || "") });
      return;
    }
    if (url.pathname === "/api/live-listings" && request.method === "GET") {
      json(response, 200, livePayload(await refreshLiveListings({ ...requestedRegion(url), force: false })));
      return;
    }
    if (url.pathname === "/api/live-listings/sync" && request.method === "POST") {
      json(response, 200, livePayload(await refreshLiveListings({ ...requestedRegion(url), force: true })));
      return;
    }
    if (url.pathname === "/api/external-links" && request.method === "GET") {
      const region = requestedRegion(url);
      json(response, 200, { ...region, providers: await externalProviders(region.legalCode, region.regionName) });
      return;
    }
    if (url.pathname.startsWith("/api/")) { json(response, 404, { error: "API를 찾을 수 없습니다." }); return; }
    const relativePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const filePath = normalize(join(root, relativePath));
    if (!filePath.startsWith(normalize(root))) { response.writeHead(403).end("Forbidden"); return; }
    const info = await stat(filePath);
    const resolvedPath = info.isDirectory() ? join(filePath, "index.html") : filePath;
    response.writeHead(200, { "Content-Type": mime[extname(resolvedPath)] || "application/octet-stream", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    response.end(await readFile(resolvedPath));
  } catch (error) {
    if (request.url?.startsWith("/api/")) { json(response, 502, { error: error.message || "외부 매물 동기화에 실패했습니다." }); return; }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("찾을 수 없습니다.");
  }
}).listen(port, host, () => {
  console.log(`토지잇기 지도가 http://${host}:${port} 에서 실행 중입니다.`);
  console.log(`기본 조회 지역: ${liveConfig.defaultRegionName} (${liveConfig.defaultLegalCode})`);
  console.log(`공용 데이터베이스: ${databaseConfigured() ? "연결 설정됨" : "미설정 · 로컬 저장 모드"}`);
  console.log(`가족 공유 링크 보호: ${sharedConfig.familyAccessKey ? "활성" : "비활성"}`);
});
