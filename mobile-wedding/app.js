const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const storageKey = 'marry-me-invitation-draft';
const invitationIdKey = 'marry-me-invitation-id';
const inviteParam = new URLSearchParams(location.search).get('invite');
function getLocalInvitationId() {
  try {
    const existing = localStorage.getItem(invitationIdKey);
    if (existing) return existing;
    const id = `wedding-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(invitationIdKey, id);
    return id;
  } catch { return `wedding-${Date.now()}`; }
}
let invitationId = null;
let publicInvitationId = inviteParam || null;
let currentUser = null;
let authMode = 'register';
let saveAfterAuth = false;
const defaultHeroPhoto = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85';
const sampleGallery = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=800&q=80',
];
const sectionCatalog = [
  { id: 'intro', label: '인사말' }, { id: 'gallery', label: '갤러리' }, { id: 'location', label: '오시는 길' },
  { id: 'account', label: '마음 전하기' }, { id: 'rsvp', label: '참석 여부' },
];
const fontFamilies = {
  myeongjo: "'Nanum Myeongjo', serif",
  modern: 'Pretendard, Arial, sans-serif',
  romantic: "'DM Serif Display', 'Nanum Myeongjo', serif",
};
const themePalettes = {
  blush: { surface: '#fff3f0', ink: '#5c413d', accent: '#bd776e' },
  ivory: { surface: '#f7f1e5', ink: '#655943', accent: '#a58a63' },
  sage: { surface: '#edf2e9', ink: '#4f6350', accent: '#708571' },
  night: { surface: '#e8e6ee', ink: '#4e495c', accent: '#766e94' },
};

const defaultState = {
  groom: '상원', bride: '다정', date: '2025-10-18T13:30', openingLine: 'Our wedding day', mainTitle: '상원 & 다정', guestHeading: '결혼식에 초대합니다.',
  message: '서로의 모든 날을 함께하고 싶은 두 사람이\n새로운 시작을 약속합니다.',
  venue: '아펠가모 잠실', address: '서울 송파구 올림픽로 269', transport: '잠실역 7번 출구 도보 5분',
  groomAccount: '국민은행 123456-01-123456', brideAccount: '신한은행 110-456-789012',
  theme: 'blush', heroPhoto: defaultHeroPhoto, gallery: [],
  sections: sectionCatalog.map(({ id }) => ({ id, enabled: true })),
  design: { font: 'myeongjo', textColor: '#ffffff', layout: 'photo', align: 'center', titlePosition: { x: 50, y: 68 } },
  locationConfig: { mode: 'map', mapNote: '잠실역 7번 출구에서 도보 5분 거리에 있습니다.', subway: '2호선 · 8호선 잠실역 7번 출구', bus: '잠실역.롯데월드 정류장 하차' },
};

let state = loadDraft();
const toast = $('.toast');

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const migratedDraft = migrateLegacySample(draft);
    if (migratedDraft !== draft) localStorage.setItem(storageKey, JSON.stringify(migratedDraft));
    return { ...defaultState, ...migratedDraft };
  }
  catch { return { ...defaultState }; }
}

function migrateLegacySample(invitation) {
  if (invitation?.groom === '도윤' && invitation?.bride === '다정') {
    return { ...invitation, groom: '상원' };
  }
  return invitation;
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove('show'), 2300);
}

function formatDate(value, compact = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return compact ? '2025. 10. 18' : '2025. 10. 18 SAT · 1:30 PM';
  const datePart = `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}`;
  if (compact) return datePart;
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const hour = date.getHours() % 12 || 12;
  return `${datePart} ${days[date.getDay()]} · ${hour}:${String(date.getMinutes()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function setFormValues() {
  $('#groomInput').value = state.groom;
  $('#brideInput').value = state.bride;
  $('#dateInput').value = state.date;
  $('#openingLineInput').value = state.openingLine;
  $('#mainTitleInput').value = state.mainTitle;
  $('#messageInput').value = state.message;
  $('#guestHeadingInput').value = state.guestHeading;
  $('#venueInput').value = state.venue;
  $('#addressInput').value = state.address;
  $('#transportInput').value = state.transport;
  $('#mapNoteInput').value = state.locationConfig.mapNote;
  $('#subwayInput').value = state.locationConfig.subway;
  $('#busInput').value = state.locationConfig.bus;
  $('#groomAccountInput').value = state.groomAccount;
  $('#brideAccountInput').value = state.brideAccount;
}

function escapeHtml(text) {
  return text.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function messageHtml(text) { return escapeHtml(text).replace(/\n/g, '<br>'); }

function normalizeSections(sections) {
  const saved = Array.isArray(sections) ? sections : [];
  const valid = saved.filter((section, index, list) => sectionCatalog.some((item) => item.id === section?.id) && list.findIndex((item) => item?.id === section.id) === index)
    .map((section) => ({ id: section.id, enabled: section.enabled !== false }));
  sectionCatalog.forEach((section) => { if (!valid.some((item) => item.id === section.id)) valid.push({ id: section.id, enabled: true }); });
  return valid;
}

function normalizeDesign(design) {
  const source = design && typeof design === 'object' ? design : {};
  return {
    font: Object.hasOwn(fontFamilies, source.font) ? source.font : 'myeongjo',
    textColor: /^#[0-9a-f]{6}$/i.test(source.textColor) ? source.textColor : '#ffffff',
    layout: ['photo', 'editorial', 'minimal'].includes(source.layout) ? source.layout : 'photo',
    align: ['left', 'center', 'right'].includes(source.align) ? source.align : 'center',
    titlePosition: { x: Math.max(8, Math.min(92, Number(source.titlePosition?.x) || 50)), y: Math.max(12, Math.min(88, Number(source.titlePosition?.y) || 68)) },
  };
}

function normalizeLocationConfig(config) {
  const source = config && typeof config === 'object' ? config : {};
  return { mode: ['map', 'text', 'transit'].includes(source.mode) ? source.mode : 'map', mapNote: String(source.mapNote || '').slice(0, 500), subway: String(source.subway || '').slice(0, 500), bus: String(source.bus || '').slice(0, 500) };
}

function render() {
  state.sections = normalizeSections(state.sections);
  state.design = normalizeDesign(state.design);
  state.locationConfig = normalizeLocationConfig(state.locationConfig);
  const groom = state.groom.trim() || '신랑';
  const bride = state.bride.trim() || '신부';
  const date = formatDate(state.date);
  const safeMessage = state.message.trim() || '두 사람이 새로운 시작을 약속합니다.';
  const mainTitle = state.mainTitle.trim() || `${groom} & ${bride}`;
  const openingLine = state.openingLine.trim() || 'Our wedding day';
  const guestHeading = state.guestHeading.trim() || '결혼식에 초대합니다.';
  const hero = state.heroPhoto || defaultHeroPhoto;

  $('#previewGroom').textContent = groom; $('#previewBride').textContent = bride; $('#previewDate').textContent = date;
  $('.card-image img').src = hero;
  $('.hero-card .card-script').textContent = openingLine;
  renderPhonePreview(mainTitle, openingLine, date, safeMessage, hero);
  $('#guestCouple').textContent = `${groom.toUpperCase()} & ${bride.toUpperCase()}`;
  $('#guestDate').textContent = formatDate(state.date, true);
  $('#guestNames').textContent = `${groom} 그리고 ${bride}`;
  $('#guestHeading').textContent = guestHeading;
  $('#guestMessage').innerHTML = messageHtml(safeMessage);
  $('.guest-cover').style.backgroundImage = `linear-gradient(rgba(55,37,34,.2),rgba(55,37,34,.2)),url("${hero}")`;
  $('#locationTitle').textContent = state.venue || '예식장';
  $('#locationAddress').innerHTML = `${escapeHtml(state.address || '주소를 입력해 주세요.')}<br />${escapeHtml(state.transport || '')}`;
  $('#mapPlaceName').textContent = state.address || '예식 장소';
  $('#groomAccountLabel').textContent = `신랑 ${groom}`; $('#brideAccountLabel').textContent = `신부 ${bride}`;
  $('#groomAccountText').textContent = state.groomAccount; $('#brideAccountText').textContent = state.brideAccount;
  $$('.copy-account')[0].dataset.account = state.groomAccount; $$('.copy-account')[1].dataset.account = state.brideAccount;
  document.body.className = state.theme === 'blush' ? '' : `theme-${state.theme}`;
  $$('.theme').forEach((button) => button.classList.toggle('active', button.dataset.theme === state.theme));
  applyThemePalette();
  renderGallery();
  renderSectionComposer();
  renderDesignControls();
  renderLocationControls();
  renderGuestInvitation();
}

function applyThemePalette() {
  const palette = themePalettes[state.theme] || themePalettes.blush;
  document.documentElement.style.setProperty('--selected-surface', palette.surface);
  document.documentElement.style.setProperty('--selected-ink', palette.ink);
  document.documentElement.style.setProperty('--selected-accent', palette.accent);
  $('.hero-card').style.borderColor = palette.accent;
  $('.card-content').style.backgroundColor = palette.surface;
  $('.card-content').style.color = palette.ink;
  $('.guest-details').style.backgroundColor = palette.surface;
  $('.guest-invitation').style.borderColor = palette.accent;
  $('.guest-invitation').style.backgroundColor = palette.surface;
}

function renderPhonePreview(mainTitle, openingLine, date, message, hero) {
  const phoneInvitation = $('.mobile-invitation');
  const layout = state.design.layout;
  const heading = `<h3>${escapeHtml(mainTitle)}</h3>`;
  const title = `<p class="card-script">${escapeHtml(openingLine)}</p>${heading}<p class="mobile-date">${escapeHtml(date.replace(' ·', ''))}</p>`;
  const copy = `${title}<span class="line"></span><p class="mobile-message">${messageHtml(message)}</p>`;
  if (layout === 'editorial') {
    phoneInvitation.innerHTML = `<div class="phone-editorial"><img src="${escapeHtml(hero)}" alt="신랑 신부 대표 사진"><div class="phone-copy">${copy}</div></div>`;
  } else if (layout === 'minimal') {
    phoneInvitation.innerHTML = `<div class="phone-minimal"><i>✦</i><div class="phone-copy">${copy}</div></div>`;
  } else {
    phoneInvitation.innerHTML = `<div class="phone-photo"><img class="mobile-main-photo" src="${escapeHtml(hero)}" alt="신랑 신부 대표 사진"><div class="phone-title-layer" role="button" tabindex="0" aria-label="제목 위치를 드래그해 변경"><span class="drag-handle">${title}</span></div><p class="phone-message-layer">${messageHtml(message)}</p></div>`;
  }
  const palette = themePalettes[state.theme] || themePalettes.blush;
  phoneInvitation.style.setProperty('--phone-surface', palette.surface);
  phoneInvitation.style.setProperty('--phone-ink', state.design.textColor === '#ffffff' && layout !== 'photo' ? palette.ink : state.design.textColor);
  phoneInvitation.style.setProperty('--phone-font', fontFamilies[state.design.font]);
  phoneInvitation.style.setProperty('--phone-align', state.design.align);
  const titleLayer = $('.phone-title-layer');
  if (titleLayer) setupTitleDrag(titleLayer, phoneInvitation);
}

function setupTitleDrag(titleLayer, phoneInvitation) {
  const setPosition = (position) => {
    titleLayer.style.left = `${position.x}%`;
    titleLayer.style.top = `${position.y}%`;
    titleLayer.style.transform = 'translate(-50%, -50%)';
    titleLayer.style.textAlign = state.design.align;
  };
  setPosition(state.design.titlePosition);
  let dragging = false;
  titleLayer.addEventListener('pointerdown', (event) => { dragging = true; titleLayer.setPointerCapture(event.pointerId); event.preventDefault(); });
  titleLayer.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const rect = phoneInvitation.getBoundingClientRect();
    state.design.titlePosition = { x: Math.max(8, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(12, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100)) };
    setPosition(state.design.titlePosition);
  });
  titleLayer.addEventListener('pointerup', (event) => { dragging = false; titleLayer.releasePointerCapture(event.pointerId); notify('제목 위치를 저장할 준비가 되었어요.'); });
}

function renderGallery() {
  const editorGallery = $('#editorGallery');
  const guestGallery = $('#guestGallery');
  if (!state.gallery.length) {
    editorGallery.innerHTML = '<p>선택한 사진이 여기에 보여요.</p>';
    return;
  }
  editorGallery.innerHTML = state.gallery.map((src, index) => `<figure><img src="${src}" alt="갤러리 사진 ${index + 1}"><button class="remove-photo" type="button" data-index="${index}" aria-label="사진 삭제">×</button></figure>`).join('');
  guestGallery.innerHTML = state.gallery.map((src, index) => `<img src="${src}" alt="웨딩 갤러리 사진 ${index + 1}">`).join('');
  $$('.remove-photo').forEach((button) => button.addEventListener('click', () => {
    state.gallery.splice(Number(button.dataset.index), 1); render(); notify('사진을 삭제했어요.');
  }));
}

function renderSectionComposer() {
  $('#sectionComposer').innerHTML = state.sections.map((section, index) => {
    const label = sectionCatalog.find((item) => item.id === section.id).label;
    return `<div class="composer-row ${section.enabled ? '' : 'is-disabled'}"><input type="checkbox" data-section-toggle="${section.id}" ${section.enabled ? 'checked' : ''} aria-label="${label} 표시"><b>${label}</b><span class="composer-actions"><button type="button" data-move-section="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''} aria-label="위로 이동">↑</button><button type="button" data-move-section="${index}" data-direction="1" ${index === state.sections.length - 1 ? 'disabled' : ''} aria-label="아래로 이동">↓</button></span></div>`;
  }).join('');
  $$('[data-section-toggle]').forEach((input) => input.addEventListener('change', () => {
    state.sections.find((section) => section.id === input.dataset.sectionToggle).enabled = input.checked;
    render();
  }));
  $$('[data-move-section]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.moveSection); const nextIndex = index + Number(button.dataset.direction);
    [state.sections[index], state.sections[nextIndex]] = [state.sections[nextIndex], state.sections[index]];
    render();
  }));
}

function renderDesignControls() {
  $('#fontSelect').value = state.design.font;
  $('#textColorInput').value = state.design.textColor;
  $('#textColorValue').textContent = state.design.textColor.toUpperCase();
  $$('.color-preset').forEach((button) => button.classList.toggle('active', button.dataset.textColor.toLowerCase() === state.design.textColor.toLowerCase()));
  $$('.layout-choice').forEach((button) => button.classList.toggle('active', button.dataset.layout === state.design.layout));
  $$('[data-align]').forEach((button) => button.classList.toggle('active', button.dataset.align === state.design.align));
}

function renderLocationControls() {
  $$('.location-picker button').forEach((button) => button.classList.toggle('active', button.dataset.locationMode === state.locationConfig.mode));
  $$('.location-field').forEach((field) => { field.hidden = field.dataset.locationField !== state.locationConfig.mode && !(state.locationConfig.mode === 'transit' && field.dataset.locationField === 'transit'); });
}

function renderGuestInvitation() {
  const groom = state.groom.trim() || '신랑';
  const bride = state.bride.trim() || '신부';
  const mainTitle = state.mainTitle.trim() || `${groom} & ${bride}`;
  const imageList = state.gallery.length ? state.gallery : sampleGallery;
  const locationConfig = state.locationConfig;
  const locationBody = locationConfig.mode === 'map'
    ? `<div class="map-sketch"><b>${escapeHtml(state.venue || '예식 장소')}</b></div><p>${messageHtml(locationConfig.mapNote || state.transport || '')}</p>`
    : locationConfig.mode === 'transit'
      ? `<div class="transit-guide"><div><b>지하철</b>${escapeHtml(locationConfig.subway)}</div><div><b>버스</b>${escapeHtml(locationConfig.bus)}</div></div>`
      : `<p>${messageHtml(`${state.address || ''}\n${state.transport || ''}`)}</p>`;
  const mainIntro = state.design.layout === 'editorial'
    ? `<section class="invite-section invite-intro layout-editorial"><img src="${escapeHtml(state.heroPhoto || defaultHeroPhoto)}" alt="신랑 신부 대표 사진"><div class="editorial-copy"><p class="section-kicker">${escapeHtml(state.openingLine || 'WEDDING INVITATION')}</p><h3>${escapeHtml(mainTitle)}</h3><p>${messageHtml(state.message || '두 사람이 새로운 시작을 약속합니다.')}</p></div></section>`
    : `<section class="invite-section invite-intro ${state.design.layout === 'minimal' ? 'layout-minimal' : ''}"><p class="section-kicker">${escapeHtml(state.openingLine || 'WEDDING INVITATION')}</p><h3>${escapeHtml(mainTitle)}</h3><p>${messageHtml(state.message || '두 사람이 새로운 시작을 약속합니다.')}</p></section>`;
  const blocks = {
    intro: mainIntro,
    gallery: `<section class="invite-section"><p class="section-kicker">OUR MOMENTS</p><h3>Gallery</h3><div class="invite-gallery-grid">${imageList.map((image, index) => `<img src="${escapeHtml(image)}" alt="웨딩 갤러리 사진 ${index + 1}">`).join('')}</div></section>`,
    location: `<section class="invite-section invite-location"><p class="section-kicker">LOCATION</p><h3>${escapeHtml(state.venue || '예식 장소')}</h3>${locationBody}</section>`,
    account: `<section class="invite-section invite-account"><p class="section-kicker">GIFT ACCOUNT</p><h3>마음 전하기</h3><div class="account-list"><div><span>신랑 ${escapeHtml(groom)}</span><button class="guest-copy" data-account="${escapeHtml(state.groomAccount)}">계좌 복사</button></div><div><span>신부 ${escapeHtml(bride)}</span><button class="guest-copy" data-account="${escapeHtml(state.brideAccount)}">계좌 복사</button></div></div></section>`,
    rsvp: `<section class="invite-section invite-rsvp"><p class="section-kicker">RSVP</p><h3>참석 여부를 알려 주세요</h3><p>더 좋은 자리를 준비하는 데 큰 도움이 됩니다.</p><div class="rsvp-actions"><button type="button" data-rsvp="참석">참석할게요</button><button type="button" data-rsvp="불참">아쉽지만 불참할게요</button></div></section>`,
  };
  const invitation = $('#guestInvitation');
  invitation.innerHTML = state.sections.filter((section) => section.enabled).map((section) => blocks[section.id]).join('') || '<section class="invite-section"><h3>표시할 섹션을 선택해 주세요.</h3></section>';
  invitation.style.setProperty('--invite-font', fontFamilies[state.design.font]);
  invitation.style.setProperty('--invite-text-color', state.design.textColor);
  invitation.style.setProperty('--invite-align', state.design.align);
  $('.card-content').style.fontFamily = fontFamilies[state.design.font];
  const intro = $('.invite-intro');
  if (intro) intro.style.setProperty('--invite-photo', `url("${state.heroPhoto || defaultHeroPhoto}")`);
  $$('.guest-copy').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.account); notify('계좌번호를 복사했어요.'); }
    catch { notify(button.dataset.account); }
  }));
  $$('[data-rsvp]').forEach((button) => button.addEventListener('click', () => openRsvp(button.dataset.rsvp)));
}

function syncField(event) {
  const key = event.target.id.replace('Input', '').replace('message', 'message').replace('date', 'date').replace('groom', 'groom').replace('bride', 'bride').replace('venue', 'venue').replace('address', 'address').replace('transport', 'transport').replace('groomAccount', 'groomAccount').replace('brideAccount', 'brideAccount');
  state[key] = event.target.value;
  render();
}

async function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveDraft() {
  if (!currentUser) {
    saveAfterAuth = true;
    openAuth();
    notify('저장하려면 먼저 가입하거나 로그인해 주세요.');
    return;
  }
  try {
    if (!invitationId) {
      const createResponse = await fetch('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
      });
      if (!createResponse.ok) throw new Error('Create failed');
      const created = await createResponse.json();
      invitationId = created.id;
      publicInvitationId = created.publicId;
    }
    const response = await fetch(`/api/invitations/${encodeURIComponent(invitationId)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error('Save failed');
    const saved = await response.json();
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem(invitationIdKey, invitationId);
    const shareUrl = `${location.origin}${location.pathname}?invite=${encodeURIComponent(publicInvitationId)}#gallery`;
    await navigator.clipboard?.writeText(shareUrl);
    notify('저장했어요. 공유 링크도 복사되었습니다.');
  } catch {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      notify('서버에 연결하지 못해 이 브라우저에 임시 저장했어요.');
    } catch { notify('저장 공간이 부족해 사진을 제외하고 다시 시도해 주세요.'); }
  }
}

function setupAccordions() {
  $$('.step-toggle').forEach((toggle) => toggle.addEventListener('click', () => {
    const target = toggle.closest('.editor-step');
    const isOpen = target.classList.contains('is-open');
    $$('.editor-step').forEach((step) => {
      step.classList.remove('is-open');
      step.querySelector('.step-toggle').setAttribute('aria-expanded', 'false');
      step.querySelector('.chevron').textContent = '⌄';
    });
    if (!isOpen) {
      target.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.querySelector('.chevron').textContent = '⌃';
    }
  }));
}

function openDialog(id) { $(id).showModal(); }

function openRsvp(choice) {
  if (!publicInvitationId) { notify('청첩장이 저장·공유된 뒤 참석 여부를 받을 수 있어요.'); return; }
  const attendance = choice === '불참' ? 'declined' : 'attending';
  $('#rsvpAttendance').value = attendance;
  $('#rsvpGuests').disabled = attendance === 'declined';
  $('#rsvpSubmit').innerHTML = `${attendance === 'attending' ? '참석' : '불참'} 여부 전달 <span>→</span>`;
  openDialog('#rsvpModal');
}

function updateUserInterface() {
  const profileButton = $('#profileButton');
  profileButton.textContent = currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'ME';
  profileButton.setAttribute('aria-label', currentUser ? `${currentUser.name}님의 프로필` : '로그인 또는 회원가입');
}

function syncAuthModal() {
  const isRegister = authMode === 'register';
  $('#authTitle').textContent = isRegister ? '내 청첩장을 시작해요' : '다시 만나서 반가워요';
  $('#authDescription').textContent = isRegister ? '간단한 가입 후 언제든 다시 편집할 수 있어요.' : '저장한 청첩장을 이어서 편집해 보세요.';
  $('.auth-name-field').hidden = !isRegister;
  $('#authName').required = isRegister;
  $('#authSubmit').innerHTML = `${isRegister ? '가입하고 시작하기' : '로그인하기'} <span>→</span>`;
  $('#authModeButton').textContent = isRegister ? '이미 계정이 있어요' : '처음 이용하시나요? 가입하기';
}

function openAuth() { syncAuthModal(); openDialog('#authModal'); }

async function showProfile() {
  if (!currentUser) { openAuth(); return; }
  $('#profileTitle').textContent = `${currentUser.name}님의 청첩장`;
  $('#profileDescription').textContent = '편집할 청첩장을 선택하거나 새로운 이야기를 시작해 보세요.';
  $('#logoutButton').hidden = false;
  $('#invitationList').innerHTML = '<p>청첩장을 불러오는 중이에요.</p>';
  openDialog('#profileModal');
  try {
    const response = await fetch('/api/invitations');
    if (!response.ok) throw new Error();
    const { invitations } = await response.json();
    $('#invitationList').innerHTML = invitations.length ? invitations.map((invitation) => `<div class="invitation-item"><div><span>${escapeHtml(formatDate(invitation.date, true))}</span><b>${escapeHtml(invitation.groom || '신랑')} &amp; ${escapeHtml(invitation.bride || '신부')}</b></div><button type="button" data-load-invitation="${invitation.id}">편집하기</button></div>`).join('') : '<p>아직 만든 청첩장이 없어요.</p>';
    $$('[data-load-invitation]').forEach((button) => button.addEventListener('click', () => loadInvitation(button.dataset.loadInvitation)));
  } catch { $('#invitationList').innerHTML = '<p>청첩장을 불러오지 못했어요.</p>'; }
}

async function loadInvitation(idToLoad) {
  try {
    const response = await fetch(`/api/invitations/${encodeURIComponent(idToLoad)}`);
    if (!response.ok) throw new Error();
    const invitation = await response.json();
    invitationId = invitation.id; publicInvitationId = invitation.publicId; state = { ...defaultState, ...invitation };
    setFormValues(); render(); $('#profileModal').close(); $('.editor-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); notify('청첩장을 불러왔어요.');
  } catch { notify('청첩장을 불러오지 못했어요.'); }
}

function startNewInvitation() {
  if (!currentUser) { openAuth(); return; }
  invitationId = null; publicInvitationId = null; state = { ...defaultState, sections: defaultState.sections.map((section) => ({ ...section })), design: { ...defaultState.design }, gallery: [] };
  setFormValues(); render(); $('#profileModal').close(); $('.editor-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); notify('새 청첩장 초안을 열었어요. 저장하면 내 목록에 추가됩니다.');
}

async function initialize() {
  try {
    const meResponse = await fetch('/api/auth/me');
    if (meResponse.ok) currentUser = (await meResponse.json()).user;
    if (publicInvitationId) {
      const response = await fetch(`/api/public/invitations/${encodeURIComponent(publicInvitationId)}`);
      if (!response.ok) throw new Error('Invitation not found');
      const remoteState = await response.json();
      const migratedState = migrateLegacySample(remoteState);
      state = { ...defaultState, ...migratedState };
    }
  } catch {
    // 서버에 연결되지 않아도 편집 화면의 기본 샘플은 볼 수 있습니다.
  }
  setFormValues(); render(); setupAccordions(); updateUserInterface();
}

initialize();
['#groomInput', '#brideInput', '#dateInput', '#openingLineInput', '#mainTitleInput', '#messageInput', '#guestHeadingInput', '#venueInput', '#addressInput', '#transportInput', '#groomAccountInput', '#brideAccountInput'].forEach((selector) => $(selector).addEventListener('input', syncField));

$('#heroPhotoInput').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { notify('대표 사진은 3MB 이하로 올려 주세요.'); return; }
  state.heroPhoto = await readImage(file); render(); notify('대표 사진을 바꿨어요.');
});

$('#galleryInput').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  if (!files.length) return;
  const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024);
  if (tooLarge) { notify('안정적인 업로드를 위해 사진 한 장은 5MB 이하로 올려 주세요.'); return; }
  state.gallery.push(...await Promise.all(files.map(readImage)));
  event.target.value = ''; render(); notify(`${files.length}장의 갤러리 사진을 추가했어요. 갤러리 개수 제한은 없어요.`);
});

$('#fontSelect').addEventListener('change', (event) => { state.design.font = event.target.value; render(); });
$('#textColorInput').addEventListener('input', (event) => { state.design.textColor = event.target.value; render(); });
$$('[data-location-mode]').forEach((button) => button.addEventListener('click', () => { state.locationConfig.mode = button.dataset.locationMode; render(); }));
$('#mapNoteInput').addEventListener('input', (event) => { state.locationConfig.mapNote = event.target.value; render(); });
$('#subwayInput').addEventListener('input', (event) => { state.locationConfig.subway = event.target.value; render(); });
$('#busInput').addEventListener('input', (event) => { state.locationConfig.bus = event.target.value; render(); });
$$('.color-preset').forEach((button) => button.addEventListener('click', () => { state.design.textColor = button.dataset.textColor; render(); }));
$$('.layout-choice').forEach((button) => button.addEventListener('click', () => { state.design.layout = button.dataset.layout; render(); }));
$$('[data-align]').forEach((button) => button.addEventListener('click', () => { state.design.align = button.dataset.align; render(); }));

$$('.theme').forEach((button) => button.addEventListener('click', () => {
  state.theme = button.dataset.theme; render(); notify(`${button.querySelector('b').textContent} 테마를 적용했어요.`);
}));

$$('[data-modal]').forEach((button) => button.addEventListener('click', () => openDialog(`#${button.dataset.modal}`)));
$('#accountButton').addEventListener('click', () => openDialog('#accountModal'));
$$('.close-modal').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
$$('.copy-account').forEach((button) => button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.dataset.account); notify('계좌번호를 복사했어요.'); }
  catch { notify(button.dataset.account); }
}));
$('#mapButton').addEventListener('click', () => window.open(`https://map.kakao.com/?q=${encodeURIComponent(state.venue || state.address)}`, '_blank', 'noopener'));
$('#profileButton').addEventListener('click', showProfile);
$('#newInvitationButton').addEventListener('click', startNewInvitation);
$('#logoutButton').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' }); currentUser = null; invitationId = null; publicInvitationId = null; updateUserInterface(); $('#profileModal').close(); notify('로그아웃했습니다.');
});
$('#authModeButton').addEventListener('click', () => { authMode = authMode === 'register' ? 'login' : 'register'; syncAuthModal(); });
$('#authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = $('#authSubmit'); submitButton.disabled = true;
  const payload = { email: $('#authEmail').value.trim(), password: $('#authPassword').value, name: $('#authName').value.trim() };
  try {
    const response = await fetch(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    currentUser = result.user; updateUserInterface(); $('#authModal').close(); $('#authForm').reset(); notify(`${currentUser.name}님, 환영합니다.`);
    if (saveAfterAuth) { saveAfterAuth = false; await saveDraft(); }
  } catch (error) { notify(error.message || '인증 요청을 처리하지 못했습니다.'); }
  finally { submitButton.disabled = false; }
});
$('#rsvpForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = $('#rsvpSubmit');
  const payload = { name: $('#rsvpName').value.trim(), attendance: $('#rsvpAttendance').value, guests: Number($('#rsvpGuests').value) };
  submitButton.disabled = true;
  try {
    const response = await fetch(`/api/public/invitations/${encodeURIComponent(publicInvitationId)}/rsvps`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    $('#rsvpModal').close();
    $('#rsvpForm').reset();
    notify(result.message);
  } catch (error) {
    notify(error.message || '참석 여부를 전달하지 못했습니다.');
  } finally { submitButton.disabled = false; }
});
$('#saveInvitation').addEventListener('click', saveDraft);
$('#openEditor').addEventListener('click', () => $('.editor-section').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('#ctaEditor').addEventListener('click', () => $('.editor-section').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('#previewInvitation').addEventListener('click', () => $('.shared-section').scrollIntoView({ behavior: 'smooth', block: 'start' }));
