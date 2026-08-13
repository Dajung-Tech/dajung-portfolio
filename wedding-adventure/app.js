const STORAGE_KEY = 'journey-wedding-invitation-v2';
const typographyTargets = [
  { id: 'couple', name: '상단 신랑 · 신부 이름', selector: '#previewCoupleTitle', color: '#fff8df', defaults: { fontTheme: 'inherit', fontSize: 8, fontWeight: 700, letterSpacing: 0, lineHeight: 1.4, align: 'left', color: null } },
  { id: 'sceneTag', name: '장면 영문 태그', selector: '#previewTag', color: '#d96f68', defaults: { fontTheme: 'inherit', fontSize: 7, fontWeight: 400, letterSpacing: 0, lineHeight: 1.3, align: 'center', color: null } },
  { id: 'sceneTitle', name: '장면 제목', selector: '#previewSceneLabel', color: '#202b44', defaults: { fontTheme: 'inherit', fontSize: 19, fontWeight: 700, letterSpacing: 0, lineHeight: 1.3, align: 'center', color: null } },
  { id: 'speaker', name: '이야기 주인공', selector: '#previewSpeaker', color: '#d96f68', defaults: { fontTheme: 'inherit', fontSize: 8, fontWeight: 600, letterSpacing: 0, lineHeight: 1.3, align: 'left', color: null } },
  { id: 'dialogue', name: '이야기 본문', selector: '#previewDialogue', color: '#202b44', defaults: { fontTheme: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.55, align: 'left', color: null } },
  { id: 'cardTitle', name: '예식 안내 제목', selector: '#cardHeadline', color: '#202b44', defaults: { fontTheme: 'inherit', fontSize: 25, fontWeight: 700, letterSpacing: 0, lineHeight: 1.3, align: 'center', color: null } },
  { id: 'cardMessage', name: '초대 문구', selector: '#cardMessage', color: '#5f6878', defaults: { fontTheme: 'inherit', fontSize: 14, fontWeight: 400, letterSpacing: 0, lineHeight: 1.65, align: 'center', color: null } },
  { id: 'details', name: '일시 · 장소 · 안내', selector: '.invitation-card dd', color: '#45546b', defaults: { fontTheme: 'inherit', fontSize: 12, fontWeight: 400, letterSpacing: 0, lineHeight: 1.4, align: 'left', color: null } },
  { id: 'buttons', name: '이전 · 예식 안내 버튼', selector: '.phone-controls button', color: '#526077', defaults: { fontTheme: 'inherit', fontSize: 12, fontWeight: 500, letterSpacing: 0, lineHeight: 1.3, align: 'center', color: null } },
  { id: 'galleryTitle', name: 'OUR MOMENTS 제목', selector: '.photo-gallery > p', color: '#d96f68', defaults: { fontTheme: 'inherit', fontSize: 7, fontWeight: 400, letterSpacing: 0, lineHeight: 1.3, align: 'center', color: null } }
];
const typographyDefaults = Object.fromEntries(typographyTargets.map((target) => [target.id, { ...target.defaults }]));
const original = {
  coupleTitle: '상원 & 다정',
  headline: '첫 번째 모험의 끝에서',
  weddingDate: '2026. 10. 17. SAT · 1:30 PM',
  venue: '가든 스테이지, 서울',
  invitationMessage: '한 사람의 일상이었던 두 길이\n이제 함께 걷는 하나의 모험이 됩니다.',
  account: '마음 전하실 곳 · 신랑 상원',
  directions: '지하철 2호선 뚝섬역 3번 출구',
  template: 'garden',
  fontTheme: 'classic',
  typography: typographyDefaults,
  bgmUrl: '',
  bgmName: '',
  gallery: [],
  scenes: [
    { label: '처음의 길', tag: 'THE FIRST PATH', speaker: '다정', dialogue: '비가 그친 어느 날, 우산 하나를 나누어 쓰며 우리의 첫 번째 모험이 시작되었어요.', textColor: '#202b44', overlay: 20, titlePosition: 14, background: 'assets/first-journey-background.png' },
    { label: '함께 찾은 계절', tag: 'OUR SECOND QUEST', speaker: '상원', dialogue: '같은 풍경을 보고, 같은 곳에서 웃으며 우리는 서로의 가장 든든한 파티가 되었습니다.', textColor: '#202b44', overlay: 30, titlePosition: 20, background: 'assets/first-journey-background.png' },
    { label: '마지막 목적지', tag: 'FINAL DESTINATION', speaker: '다정', dialogue: '우리 둘의 모험은 여기서 끝나지 않아요. 가장 소중한 분들과 다음 장을 시작하려 합니다.', textColor: '#202b44', overlay: 36, titlePosition: 12, background: 'assets/first-journey-background.png' }
  ]
};

const templates = [
  { id: 'garden', name: '가든 로맨스', description: '따뜻하고 산뜻한 낮의 결혼식', color: '#d96f68' },
  { id: 'midnight', name: '미드나잇 무드', description: '깊은 밤, 반짝이는 약속', color: '#7e83c9' },
  { id: 'blush', name: '블러시 데이', description: '부드럽고 사랑스러운 초대', color: '#d88b9d' }
];

const fontThemes = [
  { id: 'classic', name: '고운 명조', sample: '우리의 소중한 날', family: "'Gowun Batang', serif" },
  { id: 'modern', name: '모던 고딕', sample: '우리의 소중한 날', family: "'Noto Sans KR', sans-serif" },
  { id: 'handwritten', name: '손글씨', sample: '우리의 소중한 날', family: "'Nanum Pen Script', cursive" },
  { id: 'lovely', name: '러블리', sample: '우리의 소중한 날', family: "'Jua', sans-serif" },
  { id: 'retro', name: '레트로 게임', sample: 'OUR WEDDING DAY', family: "'Press Start 2P', 'Noto Sans KR', sans-serif" }
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const $ = (selector) => document.querySelector(selector);
const fields = ['coupleTitle', 'headline', 'weddingDate', 'venue', 'invitationMessage', 'account', 'directions'];
let activeScene = 0;
let activeTypographyTarget = 'couple';
let guideOpen = false;
let activePhoto = 0;
let photoScale = 1;
let photoX = 0;
let photoY = 0;
const photoPointers = new Map();
let pointerStart = null;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let photoRenderFrame = 0;
const sharedInvitation = stateFromShareLink();
const readOnlyMode = Boolean(sharedInvitation);
let state = loadState(sharedInvitation);

function stateFromShareLink() {
  const encoded = new URLSearchParams(window.location.search).get('invite');
  if (!encoded) return null;
  try {
    const json = decodeURIComponent(escape(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))));
    const shared = JSON.parse(json);
    return shared && Array.isArray(shared.scenes) && shared.scenes.length ? normalizeState(shared) : null;
  } catch { return null; }
}

function normalizeState(value = {}) {
  const normalized = { ...clone(original), ...value };
  normalized.typography = Object.fromEntries(typographyTargets.map((target) => [
    target.id,
    { ...target.defaults, ...(value.typography?.[target.id] || {}) }
  ]));
  normalized.gallery = Array.isArray(value.gallery) ? value.gallery : [];
  return normalized;
}

function loadState(shared = null) {
  if (shared) return normalizeState(shared);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.scenes) && saved.scenes.length ? normalizeState(saved) : normalizeState();
  } catch { return clone(original); }
}

function saveState(showToast = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  $('#savedStatus').textContent = '자동 저장됨';
  if (showToast) notify('청첩장 내용을 저장했어요.');
}

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function currentScene() { return state.scenes[activeScene]; }
function setFormValue(id, value) { const el = $(`#${id}`); if (el) el.value = value ?? ''; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }

function renderTemplates() {
  $('#templateList').innerHTML = templates.map((template) => `
    <button class="template-card ${state.template === template.id ? 'active' : ''}" data-template="${template.id}" type="button">
      <i style="--template-color:${template.color}"></i><span><b>${template.name}</b><small>${template.description}</small></span>
    </button>`).join('');
}

function renderFontThemes() {
  $('#fontList').innerHTML = fontThemes.map((font) => `
    <button class="font-card ${state.fontTheme === font.id ? 'active' : ''}" data-font-theme="${font.id}" type="button" style="--font-preview:${font.family}">
      <span><b>${font.name}</b><small>${font.sample}</small></span><i aria-hidden="true">✓</i>
    </button>`).join('');
}

function renderTypographyEditor() {
  const target = typographyTargets.find((item) => item.id === activeTypographyTarget) || typographyTargets[0];
  const style = state.typography[target.id];
  $('#typographyTarget').innerHTML = typographyTargets.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  $('#typographyTarget').value = target.id;
  $('#typographyFont').innerHTML = `<option value="inherit">전체 글꼴 따르기</option>${fontThemes.map((font) => `<option value="${font.id}">${font.name}</option>`).join('')}`;
  $('#typographyFont').value = style.fontTheme;
  setFormValue('typographySize', style.fontSize);
  setFormValue('typographyWeight', style.fontWeight);
  setFormValue('typographySpacing', style.letterSpacing);
  setFormValue('typographyLineHeight', style.lineHeight);
  setFormValue('typographyAlign', style.align);
  setFormValue('typographyColor', style.color || target.color);
  $('#typographySizeValue').textContent = `${style.fontSize}px`;
  $('#typographySpacingValue').textContent = `${style.letterSpacing}px`;
  $('#typographyLineHeightValue').textContent = style.lineHeight;
  $('#typographyColorDefault').hidden = Boolean(style.color);
  document.querySelectorAll('.typography-highlight').forEach((element) => element.classList.remove('typography-highlight'));
  document.querySelectorAll(target.selector).forEach((element) => element.classList.add('typography-highlight'));
}

function renderEditor() {
  fields.forEach((field) => setFormValue(field, state[field]));
  const scene = currentScene();
  setFormValue('sceneLabel', scene.label); setFormValue('sceneTag', scene.tag); setFormValue('speaker', scene.speaker);
  setFormValue('dialogue', scene.dialogue); setFormValue('textColor', scene.textColor); setFormValue('overlay', scene.overlay); setFormValue('titlePosition', scene.titlePosition);
  renderTemplates();
  renderFontThemes();
  renderTypographyEditor();
  $('#musicStatus').hidden = !state.bgmUrl;
  $('#musicName').textContent = state.bgmName || '선택한 배경 음악';
  $('#musicUploadLabel').textContent = state.bgmUrl ? '다른 음악으로 변경하기' : 'MP3, M4A, OGG, WAV · 최대 10MB';
  $('#galleryUpload').disabled = state.gallery.length >= 6;
  $('#galleryUploadLabel').textContent = state.gallery.length >= 6 ? '사진은 최대 6장까지 추가할 수 있어요.' : 'JPG, PNG, WEBP · 사진당 최대 5MB';
  $('#galleryEditor').innerHTML = state.gallery.map((photo, index) => `<div class="gallery-editor-item"><img src="${escapeHtml(photo.url)}" alt="웨딩 사진 ${index + 1}" /><button type="button" data-gallery-index="${index}" aria-label="사진 ${index + 1} 삭제">×</button></div>`).join('');
  $('#sceneList').innerHTML = state.scenes.map((item, index) => `<button class="scene-item ${index === activeScene ? 'active' : ''}" data-index="${index}" type="button"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(item.label || '이름 없는 장면')}</span></button>`).join('');
  $('#deleteSceneButton').disabled = state.scenes.length === 1;
}

function renderPreview() {
  const scene = currentScene();
  const selectedFont = fontThemes.find((font) => font.id === state.fontTheme) || fontThemes[0];
  document.documentElement.style.setProperty('--invitation-font', selectedFont.family);
  $('#phoneFrame').dataset.template = state.template || 'garden';
  $('#previewCoupleTitle').textContent = state.coupleTitle || '신랑 & 신부';
  $('#sceneCounter').textContent = `${String(activeScene + 1).padStart(2, '0')} / ${String(state.scenes.length).padStart(2, '0')}`;
  $('#gameScene').style.backgroundImage = `url("${scene.background}")`;
  $('#sceneShade').style.background = `rgba(18, 31, 48, ${Number(scene.overlay) / 100})`;
  $('#sceneTitle').style.top = `${scene.titlePosition}%`;
  $('#previewTag').textContent = scene.tag || 'OUR JOURNEY';
  $('#previewSceneLabel').textContent = scene.label || '이름 없는 장면';
  $('#previewSceneLabel').style.color = scene.textColor;
  $('#previewSpeaker').textContent = scene.speaker || state.coupleTitle;
  $('#previewDialogue').textContent = scene.dialogue || '두 분만의 이야기를 들려주세요.';
  $('#dialogueWindow').hidden = guideOpen;
  $('#invitationCard').hidden = !guideOpen;
  $('#cardHeadline').textContent = state.headline;
  $('#cardMessage').textContent = state.invitationMessage;
  $('#cardDate').textContent = state.weddingDate;
  $('#cardVenue').textContent = state.venue;
  $('#cardDirections').textContent = state.directions;
  $('#cardAccount').textContent = state.account;
  $('#photoGallery').hidden = !state.gallery.length;
  $('#photoGrid').innerHTML = state.gallery.map((photo, index) => `<button type="button" data-photo-index="${index}" aria-label="웨딩 사진 ${index + 1} 크게 보기"><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.name || `웨딩 사진 ${index + 1}`)}" /></button>`).join('');
  $('#guideButton').textContent = guideOpen ? '이야기로 돌아가기' : '예식 안내';
  const music = $('#backgroundMusic');
  if (music.dataset.source !== state.bgmUrl) {
    music.pause();
    music.src = state.bgmUrl || '';
    music.dataset.source = state.bgmUrl || '';
    $('#soundButton').classList.remove('on');
    $('#soundButton').disabled = !state.bgmUrl;
    $('#soundButton').setAttribute('aria-label', state.bgmUrl ? '배경 음악 재생' : '등록된 배경 음악 없음');
  }
  applyTypography();
}

function applyTypography() {
  typographyTargets.forEach((target) => {
    const style = state.typography[target.id];
    const font = style.fontTheme === 'inherit' ? null : fontThemes.find((item) => item.id === style.fontTheme);
    document.querySelectorAll(target.selector).forEach((element) => {
      if (font) element.style.setProperty('font-family', font.family, 'important');
      else element.style.removeProperty('font-family');
      element.style.fontSize = `${style.fontSize}px`;
      element.style.fontWeight = style.fontWeight;
      element.style.letterSpacing = `${style.letterSpacing}px`;
      element.style.lineHeight = style.lineHeight;
      element.style.textAlign = style.align;
      if (style.color) element.style.color = style.color;
      else if (target.id !== 'sceneTitle') element.style.removeProperty('color');
    });
  });
}

function updateTypography(event) {
  const property = event.target.dataset.typographyProperty;
  if (!property) return;
  const numericProperties = new Set(['fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']);
  state.typography[activeTypographyTarget][property] = numericProperties.has(property) ? Number(event.target.value) : event.target.value;
  if (property === 'fontSize') $('#typographySizeValue').textContent = `${event.target.value}px`;
  if (property === 'letterSpacing') $('#typographySpacingValue').textContent = `${event.target.value}px`;
  if (property === 'lineHeight') $('#typographyLineHeightValue').textContent = event.target.value;
  if (property === 'color') $('#typographyColorDefault').hidden = true;
  saveState(); renderPreview();
}

function render() { if (!readOnlyMode) renderEditor(); renderPreview(); }
function chooseScene(index) { activeScene = Math.max(0, Math.min(index, state.scenes.length - 1)); guideOpen = false; render(); }
function nextScene() { if (guideOpen) { guideOpen = false; renderPreview(); return; } chooseScene((activeScene + 1) % state.scenes.length); }
function updateBasic(event) { state[event.target.id] = event.target.value; saveState(); renderPreview(); }
function updateScene(event) {
  const key = event.target.id.replace(/^scene/, '').replace(/^./, (character) => character.toLowerCase());
  currentScene()[key] = event.target.value;
  saveState(); renderPreview();
  if (key === 'label') renderEditor();
}

function showPhoto(index) {
  if (!state.gallery.length) return;
  activePhoto = (index + state.gallery.length) % state.gallery.length;
  const photo = state.gallery[activePhoto];
  $('#lightboxImage').src = photo.url;
  $('#lightboxImage').alt = photo.name || `웨딩 사진 ${activePhoto + 1}`;
  $('#lightboxCounter').textContent = `${activePhoto + 1} / ${state.gallery.length}`;
  resetPhotoZoom();
  const lightbox = $('#photoLightbox');
  if (!lightbox.open) lightbox.showModal();
  schedulePhotoRender();
}

function renderPhotoCanvas() {
  const viewport = $('#lightboxViewport');
  const canvas = $('#lightboxCanvas');
  const image = $('#lightboxImage');
  const bounds = viewport.getBoundingClientRect();
  if (!bounds.width || !bounds.height || !image.naturalWidth || !image.naturalHeight) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);
  const bufferWidth = Math.round(width * pixelRatio);
  const bufferHeight = Math.round(height * pixelRatio);
  if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
  }
  const context = canvas.getContext('2d', { alpha: false });
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = '#0e1420';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const fitScale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * fitScale * photoScale;
  const drawHeight = image.naturalHeight * fitScale * photoScale;
  const drawX = (width - drawWidth) / 2 + photoX;
  const drawY = (height - drawHeight) / 2 + photoY;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function schedulePhotoRender() {
  cancelAnimationFrame(photoRenderFrame);
  photoRenderFrame = requestAnimationFrame(renderPhotoCanvas);
}

function applyPhotoTransform() {
  schedulePhotoRender();
  $('#zoomResetButton').textContent = `${Math.round(photoScale * 100)}%`;
  $('#zoomOutButton').disabled = photoScale <= 1;
  $('#zoomInButton').disabled = photoScale >= 4;
  $('#lightboxViewport').classList.toggle('zoomed', photoScale > 1);
}

function setPhotoZoom(scale) {
  photoScale = Math.max(1, Math.min(4, scale));
  if (photoScale === 1) { photoX = 0; photoY = 0; }
  applyPhotoTransform();
}

function resetPhotoZoom() {
  photoScale = 1; photoX = 0; photoY = 0;
  photoPointers.clear(); pointerStart = null;
  applyPhotoTransform();
}

function closePhotoLightbox() { resetPhotoZoom(); $('#photoLightbox').close(); }

function pointerDistance() {
  const points = [...photoPointers.values()];
  return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function shareableState() {
  const shared = clone(state);
  shared.scenes.forEach((scene) => {
    if (scene.background?.startsWith('data:')) scene.background = 'assets/first-journey-background.png';
  });
  return shared;
}

function createShareUrl() {
  const json = JSON.stringify(shareableState());
  const encoded = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${window.location.origin}${window.location.pathname}?invite=${encoded}`;
}

async function shareInvitation() {
  const url = createShareUrl();
  const shareData = { title: `${state.coupleTitle}의 결혼식`, text: '소중한 날에 초대합니다.', url };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      notify('청첩장 링크를 공유했어요.');
      return;
    }
    await navigator.clipboard.writeText(url);
    notify('공유 링크를 복사했어요. 원하는 곳에 붙여넣어 보세요.');
  } catch (error) {
    if (error?.name !== 'AbortError') notify('링크를 복사하지 못했어요. 다시 시도해 주세요.');
  }
}

async function uploadMusic(file) {
  if (!file) return;
  const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'];
  if (!allowedTypes.includes(file.type) && !/\.(mp3|m4a|ogg|wav)$/i.test(file.name)) {
    notify('MP3, M4A, OGG, WAV 파일만 올릴 수 있어요.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    notify('배경 음악은 10MB 이하로 올려주세요.');
    return;
  }
  const label = $('#musicUploadLabel');
  label.textContent = '음악을 업로드하는 중…';
  try {
    const formData = new FormData();
    formData.append('music', file);
    const response = await fetch('/api/music', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '업로드에 실패했어요.');
    state.bgmUrl = result.url;
    state.bgmName = result.name;
    saveState(); render();
    notify('배경 음악을 추가했어요. ♪ 버튼을 눌러 들어보세요.');
  } catch (error) {
    label.textContent = 'MP3, M4A, OGG, WAV · 최대 10MB';
    notify(error.message || '음악을 업로드하지 못했어요.');
  } finally {
    $('#musicUpload').value = '';
  }
}

async function uploadPhoto(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) throw new Error('JPG, PNG, WEBP 사진만 올릴 수 있어요.');
  if (file.size > 5 * 1024 * 1024) throw new Error('사진은 한 장당 5MB 이하로 올려주세요.');
  const formData = new FormData();
  formData.append('photo', file);
  const response = await fetch('/api/photos', { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || '사진 업로드에 실패했어요.');
  return result;
}

async function uploadGallery(files) {
  const selected = Array.from(files || []);
  const available = 6 - state.gallery.length;
  if (!selected.length) return;
  if (!available) { notify('사진은 최대 6장까지 추가할 수 있어요.'); return; }
  const filesToUpload = selected.slice(0, available);
  $('#galleryUploadLabel').textContent = `${filesToUpload.length}장 업로드 중…`;
  try {
    const photos = await Promise.all(filesToUpload.map(uploadPhoto));
    state.gallery.push(...photos);
    saveState(); render();
    notify(`${photos.length}장의 웨딩 사진을 추가했어요.`);
  } catch (error) {
    notify(error.message || '사진을 업로드하지 못했어요.');
  } finally {
    $('#galleryUpload').value = '';
  }
}

fields.forEach((id) => $(`#${id}`).addEventListener('input', updateBasic));
['sceneLabel', 'sceneTag', 'speaker', 'dialogue', 'textColor', 'overlay', 'titlePosition'].forEach((id) => $(`#${id}`).addEventListener('input', updateScene));
$('#templateList').addEventListener('click', (event) => {
  const card = event.target.closest('.template-card');
  if (!card) return;
  state.template = card.dataset.template; saveState(); render();
});
$('#fontList').addEventListener('click', (event) => {
  const card = event.target.closest('.font-card');
  if (!card) return;
  state.fontTheme = card.dataset.fontTheme; saveState(); render();
});
$('#typographyTarget').addEventListener('change', (event) => {
  activeTypographyTarget = event.target.value;
  if (['cardTitle', 'cardMessage', 'details', 'galleryTitle'].includes(activeTypographyTarget)) guideOpen = true;
  renderPreview(); renderTypographyEditor();
});
document.querySelectorAll('[data-typography-property]').forEach((control) => control.addEventListener('input', updateTypography));
$('#resetTypographyButton').addEventListener('click', () => {
  const target = typographyTargets.find((item) => item.id === activeTypographyTarget) || typographyTargets[0];
  state.typography[target.id] = { ...target.defaults };
  saveState(); renderPreview(); renderTypographyEditor(); notify('선택한 글자 설정을 초기화했어요.');
});
$('#sceneList').addEventListener('click', (event) => { const item = event.target.closest('.scene-item'); if (item) chooseScene(Number(item.dataset.index)); });
$('#addSceneButton').addEventListener('click', () => {
  const base = clone(currentScene());
  base.label = '새로운 장면'; base.tag = 'OUR STORY'; base.dialogue = '두 분만의 이야기를 들려주세요.';
  state.scenes.splice(activeScene + 1, 0, base); chooseScene(activeScene + 1); saveState();
});
$('#deleteSceneButton').addEventListener('click', () => {
  if (state.scenes.length === 1) return;
  state.scenes.splice(activeScene, 1); activeScene = Math.min(activeScene, state.scenes.length - 1); saveState(); render();
});
$('#moveUpButton').addEventListener('click', () => {
  if (!activeScene) return;
  [state.scenes[activeScene - 1], state.scenes[activeScene]] = [state.scenes[activeScene], state.scenes[activeScene - 1]];
  activeScene--; saveState(); render();
});
$('#moveDownButton').addEventListener('click', () => {
  if (activeScene === state.scenes.length - 1) return;
  [state.scenes[activeScene + 1], state.scenes[activeScene]] = [state.scenes[activeScene], state.scenes[activeScene + 1]];
  activeScene++; saveState(); render();
});
$('#backgroundUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  uploadPhoto(file).then((photo) => {
    currentScene().background = photo.url; saveState(); renderPreview(); notify('새 배경을 장면에 넣었어요.');
  }).catch((error) => notify(error.message || '배경 사진을 업로드하지 못했어요.')).finally(() => { event.target.value = ''; });
});
$('#musicUpload').addEventListener('change', (event) => uploadMusic(event.target.files?.[0]));
$('#galleryUpload').addEventListener('change', (event) => uploadGallery(event.target.files));
$('#galleryEditor').addEventListener('click', (event) => {
  const button = event.target.closest('[data-gallery-index]');
  if (!button) return;
  state.gallery.splice(Number(button.dataset.galleryIndex), 1); saveState(); render(); notify('웨딩 사진을 삭제했어요.');
});
$('#photoGrid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-photo-index]');
  if (button) showPhoto(Number(button.dataset.photoIndex));
});
$('#lightboxClose').addEventListener('click', closePhotoLightbox);
$('#lightboxPrevious').addEventListener('click', () => showPhoto(activePhoto - 1));
$('#lightboxNext').addEventListener('click', () => showPhoto(activePhoto + 1));
$('#zoomOutButton').addEventListener('click', () => setPhotoZoom(photoScale - 0.5));
$('#zoomInButton').addEventListener('click', () => setPhotoZoom(photoScale + 0.5));
$('#zoomResetButton').addEventListener('click', resetPhotoZoom);
$('#photoLightbox').addEventListener('click', (event) => { if (event.target === event.currentTarget) closePhotoLightbox(); });
$('#lightboxViewport').addEventListener('wheel', (event) => {
  event.preventDefault();
  setPhotoZoom(photoScale + (event.deltaY < 0 ? 0.25 : -0.25));
}, { passive: false });
$('#lightboxViewport').addEventListener('dblclick', () => setPhotoZoom(photoScale > 1 ? 1 : 2));
$('#lightboxViewport').addEventListener('pointerdown', (event) => {
  event.currentTarget.setPointerCapture(event.pointerId);
  photoPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (photoPointers.size === 1) pointerStart = { x: event.clientX, y: event.clientY, photoX, photoY };
  if (photoPointers.size === 2) { pinchStartDistance = pointerDistance(); pinchStartScale = photoScale; }
});
$('#lightboxViewport').addEventListener('pointermove', (event) => {
  if (!photoPointers.has(event.pointerId)) return;
  photoPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (photoPointers.size === 2 && pinchStartDistance) {
    setPhotoZoom(pinchStartScale * (pointerDistance() / pinchStartDistance));
  } else if (photoPointers.size === 1 && pointerStart && photoScale > 1) {
    photoX = pointerStart.photoX + event.clientX - pointerStart.x;
    photoY = pointerStart.photoY + event.clientY - pointerStart.y;
    applyPhotoTransform();
  }
});
function releasePhotoPointer(event) {
  photoPointers.delete(event.pointerId);
  if (photoPointers.size === 1) {
    const point = [...photoPointers.values()][0];
    pointerStart = { x: point.x, y: point.y, photoX, photoY };
  } else if (!photoPointers.size) pointerStart = null;
}
$('#lightboxViewport').addEventListener('pointerup', releasePhotoPointer);
$('#lightboxViewport').addEventListener('pointercancel', releasePhotoPointer);
$('#lightboxImage').addEventListener('load', schedulePhotoRender);
new ResizeObserver(schedulePhotoRender).observe($('#lightboxViewport'));
$('#removeMusicButton').addEventListener('click', () => {
  state.bgmUrl = ''; state.bgmName = ''; saveState(); render(); notify('배경 음악을 삭제했어요.');
});
$('#nextButton').addEventListener('click', nextScene);
$('#gameScene').addEventListener('click', nextScene);
$('#previousButton').addEventListener('click', () => chooseScene((activeScene - 1 + state.scenes.length) % state.scenes.length));
$('#guideButton').addEventListener('click', () => { guideOpen = !guideOpen; renderPreview(); });
$('#shareButton').addEventListener('click', shareInvitation);
$('#previewShareButton').addEventListener('click', shareInvitation);
$('#resetButton').addEventListener('click', () => {
  if (!confirm('현재 만든 청첩장을 지우고 기본 예시로 돌아갈까요?')) return;
  state = clone(original); activeScene = 0; guideOpen = false; saveState(); render(); notify('기본 예시로 돌아왔어요.');
});
$('#soundButton').addEventListener('click', (event) => {
  const music = $('#backgroundMusic');
  if (!state.bgmUrl) { notify('먼저 배경 음악을 추가해 주세요.'); return; }
  if (music.paused) {
    music.play().then(() => {
      event.currentTarget.classList.add('on');
      event.currentTarget.setAttribute('aria-label', '배경 음악 일시정지');
      notify('배경 음악을 재생합니다.');
    }).catch(() => notify('음악을 재생하지 못했어요. 파일을 확인해 주세요.'));
  } else {
    music.pause();
    event.currentTarget.classList.remove('on');
    event.currentTarget.setAttribute('aria-label', '배경 음악 재생');
    notify('배경 음악을 잠시 멈췄어요.');
  }
});
$('#backgroundMusic').addEventListener('ended', () => $('#soundButton').classList.remove('on'));
document.addEventListener('keydown', (event) => {
  if ($('#photoLightbox').open) {
    if (event.key === 'ArrowRight') showPhoto(activePhoto + 1);
    if (event.key === 'ArrowLeft') showPhoto(activePhoto - 1);
    return;
  }
  if (event.key === 'ArrowRight') nextScene();
  if (event.key === 'ArrowLeft') $('#previousButton').click();
});

if (readOnlyMode) document.body.classList.add('readonly-invitation');
render();
