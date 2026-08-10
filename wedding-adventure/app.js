const STORAGE_KEY = 'journey-rpg-invitation-v1';
const original = {
  coupleTitle: '상원 & 다정', chapter: 'CHAPTER 01 · THE FIRST HELLO', headline: '첫 번째 모험의 끝에서',
  weddingDate: '2026. 10. 17. SAT · 1:30 PM', venue: '가든 스테이지, 서울',
  invitationMessage: '한 사람의 일상이었던 두 길이\n이제 함께 걷는 하나의 모험이 됩니다.',
  account: '마음 전하실 곳 · 신랑 상원', directions: '지하철 2호선 ○○역 3번 출구',
  scenes: [
    { label: '처음의 길', tag: 'THE FIRST PATH', speaker: '다정', dialogue: '비가 그친 어느 날, 우산 하나를 나누어 쓰며 우리의 첫 번째 모험이 시작되었어요.', textColor: '#202b44', overlay: 20, titlePosition: 14, background: 'assets/first-journey-background.png' },
    { label: '함께 찾은 계절', tag: 'OUR SECOND QUEST', speaker: '상원', dialogue: '같은 풍경을 보고, 같은 곳에서 웃으며 우리는 서로의 가장 든든한 파티가 되었습니다.', textColor: '#202b44', overlay: 30, titlePosition: 20, background: 'assets/first-journey-background.png' },
    { label: '마지막 목적지', tag: 'FINAL DESTINATION', speaker: '다정', dialogue: '우리 둘의 모험은 여기서 끝나지 않아요. 가장 소중한 분들과 다음 장을 시작하려 합니다.', textColor: '#202b44', overlay: 36, titlePosition: 12, background: 'assets/first-journey-background.png' }
  ]
};

const clone = (value) => JSON.parse(JSON.stringify(value));
let state = loadState();
let activeScene = 0;
let guideOpen = false;
const $ = (selector) => document.querySelector(selector);
const fields = ['coupleTitle','chapter','headline','weddingDate','venue','invitationMessage','account','directions'];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.scenes) && saved.scenes.length ? { ...clone(original), ...saved } : clone(original);
  } catch { return clone(original); }
}
function saveState(showToast = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showToast) notify('이 기기에 이야기를 저장했어요.');
}
function notify(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('show'), 1900);
}
function currentScene() { return state.scenes[activeScene]; }
function setFormValue(id, value) { const el = $(`#${id}`); if (el) el.value = value ?? ''; }

function renderEditor() {
  fields.forEach((field) => setFormValue(field, state[field]));
  const scene = currentScene();
  setFormValue('sceneLabel', scene.label); setFormValue('sceneTag', scene.tag); setFormValue('speaker', scene.speaker);
  setFormValue('dialogue', scene.dialogue); setFormValue('textColor', scene.textColor); setFormValue('overlay', scene.overlay); setFormValue('titlePosition', scene.titlePosition);
  $('#sceneList').innerHTML = state.scenes.map((item, index) => `<button class="scene-item ${index === activeScene ? 'active' : ''}" data-index="${index}" type="button"><b>${String(index + 1).padStart(2,'0')}</b><span>${escapeHtml(item.label || '이름 없는 장면')}</span></button>`).join('');
  $('#deleteSceneButton').disabled = state.scenes.length === 1;
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]); }
function renderPreview() {
  const scene = currentScene();
  $('#previewCoupleTitle').textContent = state.coupleTitle;
  $('#sceneCounter').textContent = `${String(activeScene + 1).padStart(2,'0')} / ${String(state.scenes.length).padStart(2,'0')}`;
  $('#gameScene').style.backgroundImage = `url("${scene.background}")`;
  $('#sceneShade').style.background = `rgba(18, 31, 48, ${Number(scene.overlay) / 100})`;
  $('#sceneTitle').style.top = `${scene.titlePosition}%`;
  $('#previewTag').textContent = scene.tag || 'OUR JOURNEY';
  $('#previewSceneLabel').textContent = scene.label || '이름 없는 장면';
  $('#previewSceneLabel').style.color = scene.textColor;
  $('#previewSpeaker').textContent = scene.speaker || state.coupleTitle;
  $('#previewDialogue').textContent = scene.dialogue || '이 장면의 이야기를 들려주세요.';
  $('#dialogueWindow').hidden = guideOpen;
  $('#invitationCard').hidden = !guideOpen;
  $('#cardHeadline').textContent = state.headline;
  $('#cardMessage').textContent = state.invitationMessage;
  $('#cardDate').textContent = state.weddingDate;
  $('#cardVenue').textContent = state.venue;
  $('#cardDirections').textContent = state.directions;
  $('#cardAccount').textContent = state.account;
  $('#guideButton').textContent = guideOpen ? '이야기로 돌아가기' : '초대 안내';
}
function render() { renderEditor(); renderPreview(); }
function chooseScene(index) { activeScene = Math.max(0, Math.min(index, state.scenes.length - 1)); guideOpen = false; render(); }
function nextScene() { if (guideOpen) { guideOpen = false; renderPreview(); return; } chooseScene((activeScene + 1) % state.scenes.length); }
function updateBasic(event) { state[event.target.id] = event.target.value; saveState(); renderPreview(); }
function updateScene(event) { const key = event.target.id.replace(/^scene/, '').replace(/^./, (x) => x.toLowerCase()); currentScene()[key] = event.target.value; saveState(); renderPreview(); if (key === 'label') renderEditor(); }

fields.forEach((id) => $(`#${id}`).addEventListener('input', updateBasic));
['sceneLabel','sceneTag','speaker','dialogue','textColor','overlay','titlePosition'].forEach((id) => $(`#${id}`).addEventListener('input', updateScene));
$('#sceneList').addEventListener('click', (event) => { const item = event.target.closest('.scene-item'); if (item) chooseScene(Number(item.dataset.index)); });
$('#addSceneButton').addEventListener('click', () => { const base = clone(currentScene()); base.label = '새로운 장면'; base.tag = 'NEW QUEST'; base.dialogue = '이곳에 두 사람만의 이야기를 적어주세요.'; state.scenes.splice(activeScene + 1, 0, base); chooseScene(activeScene + 1); saveState(); });
$('#deleteSceneButton').addEventListener('click', () => { if (state.scenes.length === 1) return; state.scenes.splice(activeScene, 1); activeScene = Math.min(activeScene, state.scenes.length - 1); saveState(); render(); });
$('#moveUpButton').addEventListener('click', () => { if (!activeScene) return; [state.scenes[activeScene - 1], state.scenes[activeScene]] = [state.scenes[activeScene], state.scenes[activeScene - 1]]; activeScene--; saveState(); render(); });
$('#moveDownButton').addEventListener('click', () => { if (activeScene === state.scenes.length - 1) return; [state.scenes[activeScene + 1], state.scenes[activeScene]] = [state.scenes[activeScene], state.scenes[activeScene + 1]]; activeScene++; saveState(); render(); });
$('#backgroundUpload').addEventListener('change', (event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { notify('배경 이미지는 5MB 이하로 올려주세요.'); event.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { currentScene().background = reader.result; saveState(); renderPreview(); notify('새 배경을 장면에 넣었어요.'); }; reader.readAsDataURL(file); });
$('#nextButton').addEventListener('click', nextScene);
$('#gameScene').addEventListener('click', nextScene);
$('#previousButton').addEventListener('click', () => chooseScene((activeScene - 1 + state.scenes.length) % state.scenes.length));
$('#guideButton').addEventListener('click', () => { guideOpen = !guideOpen; renderPreview(); });
$('#saveButton').addEventListener('click', () => saveState(true));
$('#resetButton').addEventListener('click', () => { if (!confirm('현재 만든 이야기를 지우고 기본 이야기로 돌아갈까요?')) return; state = clone(original); activeScene = 0; guideOpen = false; saveState(); render(); notify('기본 이야기로 되돌렸어요.'); });
$('#soundButton').addEventListener('click', (event) => { event.currentTarget.classList.toggle('on'); notify(event.currentTarget.classList.contains('on') ? '사운드 연출을 켰어요.' : '사운드 연출을 껐어요.'); });
document.addEventListener('keydown', (event) => { if (event.key === 'ArrowRight') nextScene(); if (event.key === 'ArrowLeft') $('#previousButton').click(); });
render();
