const STORAGE_KEY = "land-link-map.properties.v1";
const SETTINGS_KEY = "land-link-map.settings.v1";
const SHARED_STATE_KEY = "land-link-map.shared-state.v1";
const SHARED_MIGRATED_KEY = "land-link-map.shared-migrated.v1";
const DEFAULT_CENTER = { lat: 36.5, lng: 127.8 };
const SOURCE_KEYS = ["farmland", "vacant", "personal"];
const SOURCE_LABELS = {
  farmland: "농지은행", vacant: "농촌빈집은행", personal: "직접 등록"
};
const TYPE_LABELS = { land: "토지", house: "주택", farmland: "농지" };
const DEAL_LABELS = { sale: "매매", lease: "임대" };
const MARKER_LABELS = { land: "토", house: "주", farmland: "농" };
const CSV_COLUMNS = ["id", "source", "propertyType", "dealType", "title", "address", "lat", "lng", "price", "area", "landCategory", "url", "memo", "verifiedAt"];
const DEFAULT_FARMLAND_REGION = {
  sidoCode: "43", sigunguCode: "", eupmyeondongCode: "",
  legalCode: "43", regionName: "충청북도"
};
const storedSettings = loadJson(SETTINGS_KEY, {});
const removedExternalSources = new Set(["naver", "disco", "hanbang", "valuemap", "ddangya"]);
const storedProperties = loadJson(STORAGE_KEY, []).filter((item) => !removedExternalSources.has(item?.source) && !/(?:naver|disco|hanbang|valuemap|ddangya)-authorized-feed/.test(item?.managedBy || ""));

const state = {
  properties: storedProperties.map(normalizeProperty).filter(Boolean),
  settings: {
    mapProvider: "osm", naverClientId: "", cadastral: false, ...storedSettings,
    farmlandRegion: { ...DEFAULT_FARMLAND_REGION, ...(storedSettings.farmlandRegion || {}) }
  },
  sources: new Set(SOURCE_KEYS),
  deal: "all",
  favoritesOnly: false,
  search: "",
  sort: "recent",
  selectedId: null,
  pendingDeleteId: null,
  mapAdapter: null,
  syncStatus: null,
  externalLinks: null,
  sharedEnabled: false,
  listingStates: loadJson(SHARED_STATE_KEY, {})
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const elements = {
  search: $("#searchInput"),
  sourceFilters: $("#sourceFilters"),
  dealFilters: $("#dealFilters"),
  sort: $("#sortSelect"),
  list: $("#listingList"),
  empty: $("#emptyState"),
  emptyTitle: $("#emptyTitle"),
  emptyDescription: $("#emptyDescription"),
  visibleCount: $("#visibleCount"),
  averageArea: $("#averageArea"),
  averagePrice: $("#averagePrice"),
  detailPanel: $("#detailPanel"),
  detailContent: $("#detailContent"),
  propertyDialog: $("#propertyDialog"),
  propertyForm: $("#propertyForm"),
  settingsDialog: $("#settingsDialog"),
  settingsForm: $("#settingsForm"),
  externalMapsDialog: $("#externalMapsDialog"),
  externalLocationLabel: $("#externalLocationLabel"),
  externalLocationCoordinates: $("#externalLocationCoordinates"),
  confirmDialog: $("#confirmDialog"),
  fileInput: $("#fileInput"),
  syncButton: $("#syncButton"),
  syncStatus: $("#syncStatus"),
  sharedStatus: $("#sharedStatus"),
  favoritesOnly: $("#favoritesOnly"),
  favoriteCount: $("#favoriteCount"),
  sidoSelect: $("#sidoSelect"),
  sigunguSelect: $("#sigunguSelect"),
  eupmyeondongSelect: $("#eupmyeondongSelect"),
  regionStatus: $("#regionStatus"),
  toast: $("#toast")
};

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.properties));
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function persistListingStates() {
  localStorage.setItem(SHARED_STATE_KEY, JSON.stringify(state.listingStates));
}

function uid() {
  return globalThis.crypto?.randomUUID?.() || `property-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProperty(raw) {
  if (!raw || !raw.title || !raw.address) return null;
  const hasLat = raw.lat !== null && raw.lat !== undefined && String(raw.lat).trim() !== "";
  const hasLng = raw.lng !== null && raw.lng !== undefined && String(raw.lng).trim() !== "";
  const lat = hasLat ? Number(raw.lat) : null;
  const lng = hasLng ? Number(raw.lng) : null;
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat >= 30 && lat <= 44 && lng >= 123 && lng <= 132;
  if (!hasCoordinates && !raw.readOnly) return null;
  return {
    id: String(raw.id || uid()),
    source: SOURCE_KEYS.includes(raw.source) ? raw.source : "personal",
    propertyType: ["land", "house", "farmland"].includes(raw.propertyType) ? raw.propertyType : "land",
    dealType: raw.dealType === "lease" ? "lease" : "sale",
    title: String(raw.title).trim(),
    address: String(raw.address).trim(),
    lat: hasCoordinates ? lat : null,
    lng: hasCoordinates ? lng : null,
    price: Number(raw.price) || 0,
    area: Number(raw.area) || 0,
    landCategory: String(raw.landCategory || "").trim(),
    url: sanitizeUrl(raw.url),
    memo: String(raw.memo || "").trim(),
    verifiedAt: String(raw.verifiedAt || "").slice(0, 10),
    externalId: String(raw.externalId || ""),
    managedBy: /^(?:farmland-live|vacant-house-live)$/.test(raw.managedBy || "") ? raw.managedBy : "",
    syncedAt: String(raw.syncedAt || ""),
    readOnly: Boolean(raw.readOnly)
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function sanitizeUrl(value = "") {
  const candidate = String(value).trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function getListingState(id) {
  return state.listingStates[id] || { favorite: false, memo: "", updatedAt: "" };
}

function isFavorite(id) {
  return Boolean(getListingState(id).favorite);
}

function sharedMemo(property) {
  const memo = getListingState(property.id).memo;
  return memo || property.memo || "";
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "공용 데이터 요청에 실패했습니다.");
  return payload;
}

async function saveSharedProperty(property) {
  if (!state.sharedEnabled) return property;
  const payload = await apiJson(`/api/shared-properties/${encodeURIComponent(property.id)}`, { method: "PUT", body: JSON.stringify(property) });
  return normalizeProperty(payload.property) || property;
}

async function removeSharedProperty(id) {
  if (!state.sharedEnabled) return;
  await apiJson(`/api/shared-properties/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function saveListingState(id, nextState) {
  const normalized = { favorite: Boolean(nextState.favorite), memo: String(nextState.memo || "").trim().slice(0, 1000) };
  if (state.sharedEnabled) {
    const payload = await apiJson(`/api/listing-states/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(normalized) });
    state.listingStates[id] = payload.listingState;
  } else {
    state.listingStates[id] = { ...normalized, updatedAt: new Date().toISOString() };
  }
  persistListingStates();
  return state.listingStates[id];
}

async function initializeSharedData({ silent = false } = {}) {
  if (!elements.sharedStatus) return;
  elements.sharedStatus.textContent = "공용 데이터를 확인하는 중…";
  try {
    const payload = await apiJson("/api/shared-data");
    if (!payload.configured) {
      state.sharedEnabled = false;
      elements.sharedStatus.textContent = "공용 DB 미설정 · 이 브라우저에만 저장";
      return;
    }

    state.sharedEnabled = true;
    const remoteProperties = (payload.properties || []).map(normalizeProperty).filter((property) => property?.source === "personal");
    const remotePropertyIds = new Set(remoteProperties.map((property) => property.id));
    const shouldMigrate = localStorage.getItem(SHARED_MIGRATED_KEY) !== "1";
    const localProperties = shouldMigrate ? state.properties.filter((property) => property.source === "personal" && !remotePropertyIds.has(property.id)) : [];
    const remoteStates = payload.listingStates || {};
    const localStates = shouldMigrate ? Object.entries(state.listingStates).filter(([id]) => !remoteStates[id]) : [];

    const propertyMigrations = await Promise.allSettled(localProperties.map((property) => saveSharedProperty(property)));
    const stateMigrations = await Promise.allSettled(localStates.map(([id, listingState]) => saveListingState(id, listingState)));
    const migratedProperties = propertyMigrations.map((result, index) => result.status === "fulfilled" ? result.value : localProperties[index]);
    state.properties = [...remoteProperties, ...migratedProperties, ...state.properties.filter((property) => property.source !== "personal")];
    state.listingStates = shouldMigrate ? { ...state.listingStates, ...remoteStates } : remoteStates;
    persist();
    persistListingStates();
    renderAll();
    const failed = [...propertyMigrations, ...stateMigrations].filter((result) => result.status === "rejected").length;
    if (shouldMigrate && !failed) localStorage.setItem(SHARED_MIGRATED_KEY, "1");
    elements.sharedStatus.textContent = failed ? `가족 공용 데이터 연결됨 · 이전 데이터 ${failed}건 전송 실패` : "가족 공용 데이터 연결됨";
  } catch (error) {
    state.sharedEnabled = false;
    elements.sharedStatus.textContent = "공용 데이터 연결 실패 · 로컬 모드";
    if (!silent) showToast(error.message);
  }
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits });
}

function formatPrice(property) {
  const value = Number(property.price);
  if (!value) return "가격 미입력";
  const prefix = property.dealType === "lease" ? "연 " : "";
  if (value >= 10000) {
    const billion = Math.floor(value / 10000);
    const remainder = value % 10000;
    return `${prefix}${billion}억${remainder ? ` ${formatNumber(remainder)}만` : ""}원`;
  }
  return `${prefix}${formatNumber(value)}만원`;
}

function formatArea(area) {
  if (!Number(area)) return "면적 미입력";
  return `${formatNumber(area, 1)}㎡ · ${formatNumber(area / 3.3058, 1)}평`;
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return "—";
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(km < 10 ? 1 : 0)}km`;
}

function distanceKm(a, b) {
  if (![a?.lat, a?.lng, b?.lat, b?.lng].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
  const radius = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function getSelected() {
  return state.properties.find((property) => property.id === state.selectedId) || null;
}

function getVisibleProperties() {
  const query = state.search.trim().toLocaleLowerCase("ko");
  const selected = getSelected();
  const properties = state.properties.filter((property) => {
    const matchesSource = state.sources.has(property.source);
    const matchesDeal = state.deal === "all" || property.dealType === state.deal;
    const matchesFavorite = !state.favoritesOnly || isFavorite(property.id);
    const haystack = `${property.title} ${property.address} ${sharedMemo(property)} ${property.landCategory}`.toLocaleLowerCase("ko");
    return matchesSource && matchesDeal && matchesFavorite && (!query || haystack.includes(query));
  });

  return properties.sort((a, b) => {
    if (state.sort === "priceAsc") return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
    if (state.sort === "areaDesc") return b.area - a.area;
    if (state.sort === "distance" && selected) return distanceKm(selected, a) - distanceKm(selected, b);
    return String(b.verifiedAt).localeCompare(String(a.verifiedAt));
  });
}

function renderAll() {
  const visible = getVisibleProperties();
  renderCounts(visible);
  renderList(visible);
  state.mapAdapter?.render(visible, state.selectedId);
  renderDetail();
}

function renderCounts(visible) {
  for (const source of SOURCE_KEYS) {
    const count = $(`#${source}Count`);
    if (count) count.textContent = state.properties.filter((property) => property.source === source).length;
  }
  if (elements.favoriteCount) elements.favoriteCount.textContent = state.properties.filter((property) => isFavorite(property.id)).length;
  elements.visibleCount.textContent = `${visible.length}건`;
  const areas = visible.map((property) => property.area).filter(Boolean);
  const salePrices = visible.filter((property) => property.dealType === "sale" && property.price).map((property) => property.price);
  elements.averageArea.textContent = areas.length ? `${formatNumber(areas.reduce((sum, value) => sum + value, 0) / areas.length)}㎡` : "—";
  elements.averagePrice.textContent = salePrices.length ? formatPrice({ price: salePrices.reduce((sum, value) => sum + value, 0) / salePrices.length, dealType: "sale" }) : "—";
}

function renderList(properties) {
  const selected = getSelected();
  elements.empty.classList.toggle("hidden", properties.length > 0);
  if (!properties.length && state.syncStatus) {
    const syncedCount = state.syncStatus.listings?.length || 0;
    elements.emptyTitle.textContent = syncedCount ? "현재 필터에 맞는 매물이 없습니다" : `${state.syncStatus.region}의 현재 매물이 없습니다`;
    elements.emptyDescription.textContent = syncedCount ? "검색어나 매물 필터를 변경해 보세요." : "다른 읍·면·동을 선택하거나 나중에 다시 동기화해 보세요.";
  } else if (!properties.length) {
    elements.emptyTitle.textContent = "아직 등록된 매물이 없습니다";
    elements.emptyDescription.textContent = "농지은행 조회 지역을 선택하거나 직접 매물을 추가하세요.";
  }
  elements.list.innerHTML = properties.map((property) => {
    const measuredDistance = selected && selected.id !== property.id ? distanceKm(selected, property) : Number.POSITIVE_INFINITY;
    const distance = Number.isFinite(measuredDistance) ? `<span class="distance">${formatDistance(measuredDistance)}</span>` : (!Number.isFinite(property.lat) ? `<span class="distance">좌표 미제공</span>` : "");
    return `
      <article class="listing-card ${property.id === state.selectedId ? "selected" : ""}" data-id="${escapeHtml(property.id)}" tabindex="0">
        <div class="listing-accent ${property.source}"></div>
        <button type="button" class="favorite-button ${isFavorite(property.id) ? "active" : ""}" data-favorite-id="${escapeHtml(property.id)}" aria-label="${isFavorite(property.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}">${isFavorite(property.id) ? "★" : "☆"}</button>
        <div class="listing-body">
          <div class="listing-meta"><span class="source-label">${SOURCE_LABELS[property.source]}</span><span>${DEAL_LABELS[property.dealType]}</span>${distance}</div>
          <h3 class="listing-title">${escapeHtml(property.title)}</h3>
          <div class="listing-price">${formatPrice(property)}</div>
          <div class="listing-details"><span>${TYPE_LABELS[property.propertyType]}</span><span>${property.area ? `${formatNumber(property.area / 3.3058, 1)}평` : "면적 미입력"}</span>${property.landCategory ? `<span>${escapeHtml(property.landCategory)}</span>` : ""}</div>
        </div>
      </article>`;
  }).join("");

  elements.list.querySelectorAll(".listing-card").forEach((card) => {
    const select = () => selectProperty(card.dataset.id);
    card.addEventListener("click", select);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") select(); });
  });
  elements.list.querySelectorAll("[data-favorite-id]").forEach((button) => button.addEventListener("click", async (event) => {
    event.stopPropagation();
    await toggleFavorite(button.dataset.favoriteId);
  }));
}

function renderDetail() {
  const property = getSelected();
  if (!property) {
    elements.detailPanel.classList.remove("open");
    elements.detailContent.innerHTML = "";
    return;
  }

  const pricePerPyeong = property.price && property.area ? property.price / (property.area / 3.3058) : 0;
  const nearby = state.properties
    .filter((item) => item.id !== property.id && [property.lat, property.lng, item.lat, item.lng].every(Number.isFinite))
    .map((item) => ({ ...item, distance: distanceKm(property, item) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  elements.detailContent.innerHTML = `
    <button type="button" class="favorite-button detail-favorite ${isFavorite(property.id) ? "active" : ""}" id="detailFavorite" aria-label="${isFavorite(property.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}">${isFavorite(property.id) ? "★" : "☆"}</button>
    <div class="detail-hero">
      <div class="detail-source"><i class="dot ${property.source}"></i>${SOURCE_LABELS[property.source]} · ${DEAL_LABELS[property.dealType]}</div>
      <h2>${escapeHtml(property.title)}</h2>
      <p class="detail-address">${escapeHtml(property.address)}</p>
      <div class="detail-price">${formatPrice(property)}<small>${property.dealType === "lease" ? "연 임대료" : "매매가"}</small></div>
    </div>
    <div class="detail-body">
      <div class="detail-stats">
        <div class="detail-stat"><span>면적</span><strong>${property.area ? `${formatNumber(property.area / 3.3058, 1)}평` : "—"}</strong></div>
        <div class="detail-stat"><span>㎡</span><strong>${property.area ? `${formatNumber(property.area, 1)}㎡` : "—"}</strong></div>
        <div class="detail-stat"><span>${property.dealType === "lease" ? "평당 연 임대료" : "평당 가격"}</span><strong>${pricePerPyeong ? `${formatNumber(pricePerPyeong, 1)}만원` : "—"}</strong></div>
        <div class="detail-stat"><span>지목 / 종류</span><strong>${escapeHtml(property.landCategory || TYPE_LABELS[property.propertyType])}</strong></div>
      </div>
      <section class="detail-section"><h3>가족 공용 메모</h3><div class="shared-memo-editor"><textarea id="sharedMemoInput" maxlength="1000" placeholder="현장 확인 내용이나 가족과 공유할 의견을 적어 주세요.">${escapeHtml(sharedMemo(property))}</textarea><div class="shared-memo-actions"><small>${state.sharedEnabled ? "가족 모두에게 바로 공유됩니다." : "현재는 이 브라우저에만 저장됩니다."}</small><button type="button" class="secondary-button" id="saveSharedMemo">메모 저장</button></div></div></section>
      ${property.readOnly && property.memo ? `<section class="detail-section"><h3>제공처 안내</h3><p class="memo-box">${escapeHtml(property.memo)}</p></section>` : ""}
      <section class="detail-section"><h3>가까운 다른 매물 · 직선거리</h3><div class="nearby-list">${nearby.length ? nearby.map((item) => `
        <button class="nearby-item" data-nearby-id="${escapeHtml(item.id)}"><span><strong>${escapeHtml(item.title)}</strong><span>${SOURCE_LABELS[item.source]} · ${formatPrice(item)}</span></span><span class="nearby-distance">${formatDistance(item.distance)}</span></button>`).join("") : `<p class="memo-box">비교할 다른 매물이 없습니다.</p>`}</div></section>
      <section class="detail-section"><h3>정보 관리</h3><p class="memo-box">확인일 ${property.verifiedAt || "미입력"}<br>${Number.isFinite(property.lat) ? `좌표 ${property.lat.toFixed(6)}, ${property.lng.toFixed(6)}` : "공식 제공처에서 지도 좌표를 제공하지 않습니다."}</p></section>
      <div class="detail-actions">
        ${property.readOnly ? `<p class="managed-notice">자동 동기화 매물은 원문에서 관리됩니다.</p>` : `<button class="secondary-button" id="editProperty">수정</button><button class="danger-button" id="deleteProperty">삭제</button>`}
        ${property.url ? `<a class="primary-button link-button wide" href="${escapeHtml(property.url)}" target="_blank" rel="noopener noreferrer">원문 매물 열기 ↗</a>` : ""}
      </div>
    </div>`;
  elements.detailPanel.classList.add("open");
  $("#detailFavorite")?.addEventListener("click", () => toggleFavorite(property.id));
  $("#saveSharedMemo")?.addEventListener("click", () => saveFamilyMemo(property.id));
  $("#editProperty")?.addEventListener("click", () => openPropertyDialog(property));
  $("#deleteProperty")?.addEventListener("click", () => requestDelete(property.id));
  elements.detailContent.querySelectorAll("[data-nearby-id]").forEach((button) => button.addEventListener("click", () => selectProperty(button.dataset.nearbyId)));
}

async function toggleFavorite(id) {
  const current = getListingState(id);
  try {
    await saveListingState(id, { ...current, favorite: !current.favorite });
    renderAll();
    showToast(current.favorite ? "즐겨찾기에서 해제했습니다." : "가족 즐겨찾기에 추가했습니다.");
  } catch (error) {
    showToast(error.message);
  }
}

async function saveFamilyMemo(id) {
  const input = $("#sharedMemoInput");
  const button = $("#saveSharedMemo");
  if (!input || !button) return;
  button.disabled = true;
  try {
    await saveListingState(id, { ...getListingState(id), memo: input.value });
    renderAll();
    showToast(state.sharedEnabled ? "가족 공용 메모를 저장했습니다." : "메모를 이 브라우저에 저장했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
}

function selectProperty(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  state.selectedId = id;
  if (Number.isFinite(property.lat) && Number.isFinite(property.lng)) state.mapAdapter?.flyTo(property);
  renderAll();
}

function openPropertyDialog(property = null, coordinates = null) {
  elements.propertyForm.reset();
  const form = elements.propertyForm.elements;
  $("#propertyDialogTitle").textContent = property ? "매물 수정" : "매물 추가";
  form.id.value = property?.id || "";
  form.source.value = property?.source || "personal";
  form.propertyType.value = property?.propertyType || "land";
  form.dealType.value = property?.dealType || "sale";
  form.title.value = property?.title || "";
  form.address.value = property?.address || "";
  form.lat.value = property?.lat ?? coordinates?.lat ?? "";
  form.lng.value = property?.lng ?? coordinates?.lng ?? "";
  form.price.value = property?.price || "";
  form.area.value = property?.area || "";
  form.landCategory.value = property?.landCategory || "";
  form.url.value = property?.url || "";
  form.memo.value = property?.memo || "";
  form.verifiedAt.value = property?.verifiedAt || new Date().toISOString().slice(0, 10);
  elements.propertyDialog.showModal();
  setTimeout(() => form.title.focus(), 50);
}

async function saveProperty(event) {
  event.preventDefault();
  const submitButton = event.submitter;
  if (submitButton) submitButton.disabled = true;
  const data = Object.fromEntries(new FormData(elements.propertyForm));
  let property = normalizeProperty({ ...data, id: data.id || uid() });
  if (!property) {
    showToast("필수 항목과 대한민국 범위의 좌표를 확인해 주세요.");
    if (submitButton) submitButton.disabled = false;
    return;
  }
  try {
    property = await saveSharedProperty(property);
    const index = state.properties.findIndex((item) => item.id === property.id);
    if (index >= 0) state.properties[index] = property;
    else state.properties.unshift(property);
    state.selectedId = property.id;
    persist();
    elements.propertyDialog.close();
    renderAll();
    state.mapAdapter?.flyTo(property);
    showToast(index >= 0 ? "공용 매물 정보를 수정했습니다." : "가족 공용 매물을 저장했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function requestDelete(id) {
  state.pendingDeleteId = id;
  elements.confirmDialog.showModal();
}

async function confirmDelete() {
  if (!state.pendingDeleteId) return;
  const id = state.pendingDeleteId;
  const button = $("#confirmDelete");
  button.disabled = true;
  try {
    await removeSharedProperty(id);
    state.properties = state.properties.filter((property) => property.id !== id);
    delete state.listingStates[id];
    if (state.selectedId === id) state.selectedId = null;
    state.pendingDeleteId = null;
    persist();
    persistListingStates();
    elements.confirmDialog.close();
    renderAll();
    showToast("공용 매물을 삭제했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
}

class OsmMapAdapter {
  constructor() {
    this.markers = new Map();
  }

  async init() {
    if (!globalThis.L) throw new Error("지도 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
    this.map = L.map("map", { zoomControl: true }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(this.map);
    this.map.on("click", (event) => openPropertyDialog(null, { lat: Number(event.latlng.lat.toFixed(7)), lng: Number(event.latlng.lng.toFixed(7)) }));
  }

  render(properties, selectedId) {
    for (const marker of this.markers.values()) marker.remove();
    this.markers.clear();
    for (const property of properties.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))) {
      const selected = property.id === selectedId;
      const size = selected ? 36 : 30;
      const icon = L.divIcon({
        className: "leaflet-div-icon",
        html: `<div class="custom-marker ${property.source} ${selected ? "selected" : ""}"><span>${MARKER_LABELS[property.propertyType]}</span></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size]
      });
      const marker = L.marker([property.lat, property.lng], { icon, zIndexOffset: selected ? 1000 : 0 }).addTo(this.map);
      marker.on("click", () => selectProperty(property.id));
      this.markers.set(property.id, marker);
    }
  }

  flyTo(property) { if (Number.isFinite(property.lat) && Number.isFinite(property.lng)) this.map.flyTo([property.lat, property.lng], Math.max(this.map.getZoom(), 14), { duration: .45 }); }
  getCenter() { const center = this.map.getCenter(); return { lat: center.lat, lng: center.lng }; }
  fit(properties) {
    properties = properties.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
    if (!properties.length) { this.map.flyTo([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 7); return; }
    if (properties.length === 1) { this.flyTo(properties[0]); return; }
    this.map.fitBounds(L.latLngBounds(properties.map((property) => [property.lat, property.lng])), { padding: [55, 55], maxZoom: 15 });
  }
  locate() {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => this.map.flyTo([coords.latitude, coords.longitude], 14),
      () => showToast("현재 위치를 확인할 수 없습니다."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
  destroy() { this.map?.remove(); this.markers.clear(); }
}

class NaverMapAdapter {
  constructor(settings) { this.settings = settings; this.markers = new Map(); }

  async init() {
    await loadNaverMaps(this.settings.naverClientId);
    const naverMaps = globalThis.naver.maps;
    this.map = new naverMaps.Map("map", {
      center: new naverMaps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      zoom: 7,
      scaleControl: true,
      mapDataControl: false,
      zoomControl: true,
      zoomControlOptions: { position: naverMaps.Position.LEFT_TOP }
    });
    naverMaps.Event.addListener(this.map, "click", (event) => openPropertyDialog(null, { lat: Number(event.coord.lat().toFixed(7)), lng: Number(event.coord.lng().toFixed(7)) }));
    if (this.settings.cadastral) {
      this.cadastral = new naverMaps.CadastralLayer();
      this.cadastral.setMap(this.map);
    }
  }

  render(properties, selectedId) {
    for (const marker of this.markers.values()) marker.setMap(null);
    this.markers.clear();
    const naverMaps = globalThis.naver.maps;
    for (const property of properties.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))) {
      const selected = property.id === selectedId;
      const size = selected ? 36 : 30;
      const marker = new naverMaps.Marker({
        position: new naverMaps.LatLng(property.lat, property.lng),
        map: this.map,
        zIndex: selected ? 1000 : 1,
        icon: {
          content: `<div class="custom-marker ${property.source} ${selected ? "selected" : ""}"><span>${MARKER_LABELS[property.propertyType]}</span></div>`,
          size: new naverMaps.Size(size, size),
          anchor: new naverMaps.Point(size / 2, size)
        }
      });
      naverMaps.Event.addListener(marker, "click", () => selectProperty(property.id));
      this.markers.set(property.id, marker);
    }
  }

  flyTo(property) {
    if (!Number.isFinite(property.lat) || !Number.isFinite(property.lng)) return;
    this.map.morph(new globalThis.naver.maps.LatLng(property.lat, property.lng), Math.max(this.map.getZoom(), 14), { duration: 450 });
  }
  getCenter() { const center = this.map.getCenter(); return { lat: center.lat(), lng: center.lng() }; }
  fit(properties) {
    properties = properties.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
    if (!properties.length) { this.map.morph(new globalThis.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng), 7); return; }
    if (properties.length === 1) { this.flyTo(properties[0]); return; }
    const bounds = new globalThis.naver.maps.LatLngBounds();
    properties.forEach((property) => bounds.extend(new globalThis.naver.maps.LatLng(property.lat, property.lng)));
    this.map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }
  locate() {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => this.map.morph(new globalThis.naver.maps.LatLng(coords.latitude, coords.longitude), 14),
      () => showToast("현재 위치를 확인할 수 없습니다."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
  destroy() {
    for (const marker of this.markers.values()) marker.setMap(null);
    this.cadastral?.setMap(null);
    this.markers.clear();
    $("#map").innerHTML = "";
  }
}

function loadNaverMaps(clientId) {
  if (globalThis.naver?.maps) return Promise.resolve();
  if (!clientId) return Promise.reject(new Error("네이버 지도 Client ID를 입력해 주세요."));
  return new Promise((resolve, reject) => {
    const oldScript = document.querySelector("script[data-naver-map]");
    oldScript?.remove();
    const script = document.createElement("script");
    script.dataset.naverMap = "true";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.onload = () => globalThis.naver?.maps ? resolve() : reject(new Error("네이버 지도 인증을 확인해 주세요."));
    script.onerror = () => reject(new Error("네이버 지도를 불러오지 못했습니다."));
    document.head.appendChild(script);
    setTimeout(() => { if (!globalThis.naver?.maps) reject(new Error("네이버 지도 연결 시간이 초과되었습니다.")); }, 10000);
  });
}

async function initializeMap() {
  try {
    state.mapAdapter?.destroy();
    $("#map").innerHTML = "";
    state.mapAdapter = state.settings.mapProvider === "naver" ? new NaverMapAdapter(state.settings) : new OsmMapAdapter();
    await state.mapAdapter.init();
    renderAll();
    if (state.properties.length) state.mapAdapter.fit(getVisibleProperties());
  } catch (error) {
    if (state.settings.mapProvider === "naver") {
      showToast(`${error.message} 기본 지도로 전환합니다.`);
      state.settings.mapProvider = "osm";
      persistSettings();
      await initializeMap();
    } else {
      $("#map").innerHTML = `<div style="display:grid;place-items:center;height:100%;padding:30px;text-align:center;color:#596860;background:#e7ece8"><div><strong>지도를 불러오지 못했습니다.</strong><p style="font-size:12px">${escapeHtml(error.message)}</p></div></div>`;
      renderAll();
    }
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(cell); cell = ""; }
    else if (character === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv() {
  if (!state.properties.length) { showToast("내보낼 매물이 없습니다."); return; }
  const content = [CSV_COLUMNS.join(","), ...state.properties.map((property) => CSV_COLUMNS.map((column) => csvEscape(property[column])).join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `토지잇기_매물백업_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast(`${state.properties.length}건을 CSV로 내보냈습니다.`);
}

async function importCsvFile(file) {
  try {
    const records = parseCsv(await file.text());
    const existingIds = new Set(state.properties.map((property) => property.id));
    const imported = records.map(normalizeProperty).filter(Boolean).map((property) => ({ ...property, id: existingIds.has(property.id) ? uid() : property.id }));
    if (!imported.length) throw new Error("가져올 수 있는 매물이 없습니다. CSV 열과 좌표를 확인해 주세요.");
    state.properties = [...imported, ...state.properties];
    persist();
    renderAll();
    state.mapAdapter?.fit(imported);
    showToast(`${imported.length}건을 가져왔습니다.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.fileInput.value = "";
  }
}

async function loadSampleData() {
  try {
    const response = await fetch("data/sample-properties.csv");
    const imported = parseCsv(await response.text()).map(normalizeProperty).filter(Boolean);
    state.properties = imported;
    persist();
    renderAll();
    state.mapAdapter?.fit(imported);
    showToast("예제 데이터 4건을 불러왔습니다.");
  } catch {
    showToast("예제 데이터를 불러오지 못했습니다.");
  }
}

function syncSummary(payload) {
  const labels = { farmland: "농지", vacant: "빈집" };
  const updated = payload.updatedAt ? new Date(payload.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "—";
  const connected = Object.entries(payload.sources || {}).filter(([, source]) => source.status === "connected").map(([key, source]) => `${labels[key] || key} ${source.count}건`);
  const setupCount = Object.values(payload.sources || {}).filter((source) => source.status === "setup-required").length;
  const errors = Object.values(payload.sources || {}).filter((source) => source.status === "error").length;
  return [`${payload.region}`, ...connected, setupCount ? `제휴 피드 미설정 ${setupCount}` : "", errors ? `오류 ${errors}` : "", updated].filter(Boolean).join(" · ");
}

function setRegionOptions(select, regions, placeholder, selectedCode = "") {
  select.innerHTML = `<option value="">${placeholder}</option>${regions.map((region) => `<option value="${escapeHtml(region.code)}">${escapeHtml(region.name)}</option>`).join("")}`;
  select.value = selectedCode;
  select.disabled = false;
}

function resetRegionSelect(select, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  select.disabled = true;
}

async function fetchRegions(level, parent = "") {
  const params = new URLSearchParams({ level });
  if (parent) params.set("parent", parent);
  const response = await fetch(`/api/farmland/regions?${params}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "지역 목록을 불러오지 못했습니다.");
  return payload.regions;
}

async function initializeFarmlandRegion() {
  const saved = state.settings.farmlandRegion;
  elements.regionStatus.textContent = "지역 목록을 불러오는 중…";
  try {
    setRegionOptions(elements.sidoSelect, await fetchRegions("sido"), "시·도", saved.sidoCode);
    if (saved.sidoCode) {
      setRegionOptions(elements.sigunguSelect, await fetchRegions("sigungu", saved.sidoCode), "시·군·구 전체", saved.sigunguCode);
    } else {
      resetRegionSelect(elements.sigunguSelect, "시·군·구 전체");
    }
    if (saved.sigunguCode) {
      setRegionOptions(elements.eupmyeondongSelect, await fetchRegions("eupmyeondong", saved.sigunguCode), "읍·면·동 전체", saved.eupmyeondongCode);
    } else {
      resetRegionSelect(elements.eupmyeondongSelect, "읍·면·동 전체");
    }
    elements.regionStatus.textContent = `${saved.regionName} 선택됨`;
    return Boolean(saved.legalCode);
  } catch (error) {
    elements.regionStatus.textContent = `지역 목록 오류 · ${error.message}`;
    return false;
  }
}

function selectedRegionName(select) {
  return select.value ? select.options[select.selectedIndex]?.textContent || "" : "";
}

function saveSelectedRegion(level) {
  const sidoCode = elements.sidoSelect.value;
  const sigunguCode = level === "sido" ? "" : elements.sigunguSelect.value;
  const eupmyeondongCode = level === "eupmyeondong" ? elements.eupmyeondongSelect.value : "";
  const legalCode = eupmyeondongCode || sigunguCode || sidoCode;
  if (!legalCode) return false;
  const names = [selectedRegionName(elements.sidoSelect)];
  if (sigunguCode) names.push(selectedRegionName(elements.sigunguSelect));
  if (eupmyeondongCode) names.push(selectedRegionName(elements.eupmyeondongSelect));
  state.settings.farmlandRegion = { sidoCode, sigunguCode, eupmyeondongCode, legalCode, regionName: names.filter(Boolean).join(" ") };
  persistSettings();
  elements.regionStatus.textContent = `${state.settings.farmlandRegion.regionName} 전체 선택됨`;
  return true;
}

async function handleSidoChange() {
  resetRegionSelect(elements.sigunguSelect, "불러오는 중…");
  resetRegionSelect(elements.eupmyeondongSelect, "읍·면·동 전체");
  if (!elements.sidoSelect.value) return;
  saveSelectedRegion("sido");
  const syncPromise = syncLiveListings({ force: true });
  try {
    setRegionOptions(elements.sigunguSelect, await fetchRegions("sigungu", elements.sidoSelect.value), "시·군·구 전체");
  } catch (error) {
    elements.regionStatus.textContent = error.message;
  }
  await syncPromise;
}

async function handleSigunguChange() {
  resetRegionSelect(elements.eupmyeondongSelect, "불러오는 중…");
  const level = elements.sigunguSelect.value ? "sigungu" : "sido";
  if (!saveSelectedRegion(level)) return;
  const syncPromise = syncLiveListings({ force: true });
  if (!elements.sigunguSelect.value) {
    resetRegionSelect(elements.eupmyeondongSelect, "읍·면·동 전체");
    await syncPromise;
    return;
  }
  try {
    setRegionOptions(elements.eupmyeondongSelect, await fetchRegions("eupmyeondong", elements.sigunguSelect.value), "읍·면·동 전체");
  } catch (error) {
    elements.regionStatus.textContent = error.message;
  }
  await syncPromise;
}

async function handleEupmyeondongChange() {
  const level = elements.eupmyeondongSelect.value ? "eupmyeondong" : "sigungu";
  if (!saveSelectedRegion(level)) return;
  await syncLiveListings({ force: true });
}

async function syncLiveListings({ force = false, silent = false } = {}) {
  if (!elements.syncButton || !elements.syncStatus) return;
  const region = state.settings.farmlandRegion;
  if (!region?.legalCode) {
    elements.syncStatus.textContent = "조회 지역을 먼저 선택하세요.";
    return;
  }
  elements.syncButton.disabled = true;
  elements.syncButton.classList.add("loading");
  elements.syncStatus.textContent = "외부 매물을 확인하는 중…";
  try {
    const params = new URLSearchParams({ legalCode: region.legalCode, regionName: region.regionName });
    const path = force ? "/api/live-listings/sync" : "/api/live-listings";
    const response = await fetch(`${path}?${params}`, { method: force ? "POST" : "GET" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "동기화 요청에 실패했습니다.");
    const incoming = payload.listings.map(normalizeProperty).filter(Boolean);
    const managedSources = new Set(["farmland-live", "vacant-house-live"]);
    state.properties = [...incoming, ...state.properties.filter((item) => !managedSources.has(item.managedBy))];
    state.syncStatus = payload;
    persist();
    renderAll();
    elements.syncStatus.textContent = syncSummary(payload);
    elements.regionStatus.textContent = `${payload.region} 선택됨`;
    if (force && incoming.length) state.mapAdapter?.fit(incoming);
    if (!silent) showToast(`실시간 매물 ${incoming.length}건을 동기화했습니다.`);
  } catch (error) {
    elements.syncStatus.textContent = `동기화 실패 · ${error.message}`;
    if (!silent) showToast(error.message);
  } finally {
    elements.syncButton.disabled = false;
    elements.syncButton.classList.remove("loading");
  }
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3000);
}

async function openExternalMapsDialog() {
  const region = state.settings.farmlandRegion;
  if (!region?.legalCode) {
    showToast("먼저 왼쪽에서 조회 지역을 선택해 주세요.");
    return;
  }

  state.externalLinks = null;
  elements.externalLocationLabel.textContent = region.regionName;
  elements.externalLocationCoordinates.textContent = `법정동 코드 ${region.legalCode}`;
  $$("[data-provider]").forEach((button) => {
    button.disabled = true;
    button.classList.remove("unsupported");
    button.querySelector("em").textContent = "확인 중…";
  });
  elements.externalMapsDialog.showModal();

  try {
    const params = new URLSearchParams({ legalCode: region.legalCode, regionName: region.regionName });
    const response = await fetch(`/api/external-links?${params}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "외부 사이트 연결 정보를 만들지 못했습니다.");
    state.externalLinks = payload.providers;
    $$("[data-provider]").forEach((button) => {
      const provider = payload.providers[button.dataset.provider];
      button.disabled = !provider?.supported;
      button.classList.toggle("unsupported", !provider?.supported);
      button.querySelector("small").textContent = provider?.message || "지역 연결 정보를 확인할 수 없습니다.";
      button.querySelector("em").textContent = provider?.supported ? "지역 적용 ↗" : "미지원";
    });
  } catch (error) {
    $$("[data-provider]").forEach((button) => {
      button.disabled = true;
      button.classList.add("unsupported");
      button.querySelector("em").textContent = "연결 실패";
    });
    showToast(error.message);
  }
}

function openExternalProvider(providerKey) {
  const provider = state.externalLinks?.[providerKey];
  if (!provider?.supported || !provider.url) return;
  if (provider.method === "POST" && provider.fields) {
    const target = `landlink-external-${Date.now()}`;
    const popup = window.open("", target);
    if (!popup) {
      showToast("새 창이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.");
      return;
    }
    popup.opener = null;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = provider.url;
    form.target = target;
    for (const [name, value] of Object.entries(provider.fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.append(input);
    }
    document.body.append(form);
    form.submit();
    form.remove();
  } else {
    window.open(provider.url, "_blank", "noopener,noreferrer");
  }
  elements.externalMapsDialog.close();
}

function openSettings() {
  const form = elements.settingsForm.elements;
  form.mapProvider.value = state.settings.mapProvider;
  form.naverClientId.value = state.settings.naverClientId;
  form.cadastral.checked = Boolean(state.settings.cadastral);
  toggleNaverSettings();
  elements.settingsDialog.showModal();
}

function toggleNaverSettings() {
  const enabled = elements.settingsForm.elements.mapProvider.value === "naver";
  $("#naverKeyField").style.opacity = enabled ? "1" : ".45";
  $("#naverKeyField").querySelector("input").disabled = !enabled;
  elements.settingsForm.elements.cadastral.disabled = !enabled;
}

async function saveSettings(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(elements.settingsForm));
  state.settings = {
    ...state.settings,
    mapProvider: data.mapProvider === "naver" ? "naver" : "osm",
    naverClientId: String(data.naverClientId || state.settings.naverClientId || "").trim(),
    cadastral: data.cadastral === "on"
  };
  persistSettings();
  elements.settingsDialog.close();
  await initializeMap();
  showToast("지도 설정을 적용했습니다.");
}

elements.search.addEventListener("input", () => { state.search = elements.search.value; renderAll(); });
elements.sourceFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-source]");
  if (!button) return;
  const source = button.dataset.source;
  if (state.sources.has(source)) state.sources.delete(source); else state.sources.add(source);
  button.classList.toggle("active", state.sources.has(source));
  renderAll();
});
elements.dealFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-deal]");
  if (!button) return;
  state.deal = button.dataset.deal;
  elements.dealFilters.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderAll();
});
elements.favoritesOnly.addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  elements.favoritesOnly.classList.toggle("active", state.favoritesOnly);
  elements.favoritesOnly.querySelector("span").textContent = state.favoritesOnly ? "★" : "☆";
  renderAll();
});
elements.sort.addEventListener("change", () => { state.sort = elements.sort.value; renderAll(); });
$("#resetFilters").addEventListener("click", () => {
  state.sources = new Set(SOURCE_KEYS);
  state.deal = "all";
  state.favoritesOnly = false;
  state.search = "";
  elements.search.value = "";
  elements.favoritesOnly.classList.remove("active");
  elements.favoritesOnly.querySelector("span").textContent = "☆";
  $$("[data-source]").forEach((button) => button.classList.add("active"));
  $$("[data-deal]").forEach((button) => button.classList.toggle("active", button.dataset.deal === "all"));
  renderAll();
});
$("#addButton").addEventListener("click", () => openPropertyDialog(null, state.mapAdapter?.getCenter()));
$("#syncButton").addEventListener("click", () => Promise.all([syncLiveListings({ force: true }), initializeSharedData({ silent: true })]));
elements.sidoSelect.addEventListener("change", handleSidoChange);
elements.sigunguSelect.addEventListener("change", handleSigunguChange);
elements.eupmyeondongSelect.addEventListener("change", handleEupmyeondongChange);
$("#loadSampleButton").addEventListener("click", loadSampleData);
$("#importButton").addEventListener("click", () => elements.fileInput.click());
$("#exportButton").addEventListener("click", exportCsv);
elements.fileInput.addEventListener("change", () => elements.fileInput.files[0] && importCsvFile(elements.fileInput.files[0]));
$("#fitButton").addEventListener("click", () => state.mapAdapter?.fit(getVisibleProperties()));
$("#locationButton").addEventListener("click", () => state.mapAdapter?.locate());
$("#externalMapsButton").addEventListener("click", openExternalMapsDialog);
elements.externalMapsDialog.addEventListener("click", (event) => {
  const button = event.target.closest("[data-provider]");
  if (button && !button.disabled) openExternalProvider(button.dataset.provider);
});
$("#settingsButton").addEventListener("click", openSettings);
$("#detailClose").addEventListener("click", () => { state.selectedId = null; renderAll(); });
elements.propertyForm.addEventListener("submit", saveProperty);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.settingsForm.elements.mapProvider.addEventListener("change", toggleNaverSettings);
$("#confirmDelete").addEventListener("click", confirmDelete);
$("#cancelDelete").addEventListener("click", () => { state.pendingDeleteId = null; elements.confirmDialog.close(); });
$$('[data-close]').forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
window.addEventListener("keydown", (event) => { if (event.key === "Escape" && elements.detailPanel.classList.contains("open")) { state.selectedId = null; renderAll(); } });

async function bootstrap() {
  renderAll();
  await initializeMap();
  await initializeSharedData();
  const ready = await initializeFarmlandRegion();
  if (ready) await syncLiveListings({ silent: true });
}

bootstrap();
setInterval(() => syncLiveListings({ silent: true }), 5 * 60_000);
setInterval(() => {
  const editing = elements.propertyDialog.open || document.activeElement?.id === "sharedMemoInput";
  if (!editing) initializeSharedData({ silent: true });
}, 30_000);
