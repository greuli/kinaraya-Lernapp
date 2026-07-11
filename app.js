const words = [
  {cat:'Begrüßung',de:'Guten Morgen',en:'Good morning',kr:'Mayad nga aga!',hint:'ma-jad nga a-ga'},
  {cat:'Höflichkeit',de:'Danke',en:'Thank you',kr:'Salamat',hint:'sa-la-mat'},
  {cat:'Grundwort',de:'Ja',en:'Yes',kr:'Huo / Ho-ud',hint:'hu-o'},
  {cat:'Grundwort',de:'Nein',en:'No',kr:'Bëkë́n / Indi',hint:'be-ken / in-di'},
  {cat:'Begrüßung',de:'Wie geht es Dir?',en:'How are you?',kr:'Musta bay pamatyagan mo?',hint:'mus-ta bai pa-mat-ja-gan mo'},
  {cat:'Begrüßung',de:'Guten Nachmittag',en:'Good afternoon',kr:'Mayad nga hapon!',hint:'ma-jad nga ha-pon'},
  {cat:'Begrüßung',de:'Guten Abend',en:'Good evening',kr:'Mayad nga gabi-i!',hint:'ma-jad nga ga-bi-i'},
  {cat:'Alltag',de:'Gut',en:'Good',kr:'Mayad',hint:'ma-jad'},
  {cat:'Alltag',de:'Wie heißt Du?',en:'What is your name?',kr:'Ano ngaran mo?',hint:'a-no nga-ran mo'},
  {cat:'Alltag',de:'Wo gehst Du hin?',en:'Where are you going?',kr:'Diin kaw maagto?',hint:'di-in kau ma-ag-to'},
  {cat:'Einkaufen',de:'Wie viel kostet es?',en:'How much?',kr:'Tag pira?',hint:'tag pi-ra'},
  {cat:'Familie',de:'Meine Liebe / Mein Schatz',en:'My love / sweetheart',kr:'Palangga ko',hint:'pa-lang-ga ko'},
  {cat:'Familie',de:'Ich liebe Dich',en:'I love you',kr:'Palangga ta ikaw',hint:'pa-lang-ga ta i-kau'},
  {cat:'Alltag',de:'Ich weiß es nicht',en:"I don't know",kr:'Wara takën kamaan',hint:'wa-ra ta-ken ka-ma-an'},
  {cat:'Unterwegs',de:'Lass uns gehen!',en:"Let's go!",kr:'Panaw ta!',hint:'pa-nau ta'},
  {cat:'Alltag',de:'Warum?',en:'Why?',kr:'Manhaw?',hint:'man-hau'},
  {cat:'Alltag',de:'Noch einmal',en:'Again',kr:'Liwan / Uman',hint:'li-wan / u-man'},
  {cat:'Sprache',de:'Sprichst Du Englisch?',en:'Do you speak English?',kr:'Kamaan kaw mag-Inglis?',hint:'ka-ma-an kau mag-ing-lis'},
  {cat:'Zahl',de:'eins',en:'one',kr:'sará',hint:'sa-ra'},
  {cat:'Zahl',de:'zwei',en:'two',kr:'darwa',hint:'dar-wa'},
  {cat:'Zahl',de:'drei',en:'three',kr:'tatlo',hint:'tat-lo'},
  {cat:'Zahl',de:'vier',en:'four',kr:'apat',hint:'a-pat'},
  {cat:'Zahl',de:'fünf',en:'five',kr:'lima',hint:'li-ma'},
  {cat:'Zahl',de:'sechs',en:'six',kr:'anëm',hint:'a-nem'},
  {cat:'Zahl',de:'sieben',en:'seven',kr:'pito',hint:'pi-to'},
  {cat:'Zahl',de:'acht',en:'eight',kr:'walo',hint:'wa-lo'},
  {cat:'Zahl',de:'neun',en:'nine',kr:'siyam',hint:'si-jam'},
  {cat:'Zahl',de:'zehn',en:'ten',kr:'pulo',hint:'pu-lo'},
  {cat:'Essen',de:'Essen / Nahrung',en:'food',kr:'pagkaën',hint:'pag-ka-en'},
  {cat:'Alltag',de:'glücklich / fröhlich',en:'happy',kr:'sadya',hint:'sad-ja'}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let state = JSON.parse(localStorage.getItem('kinaState') || '{}');
state.scores ||= {};
state.rate ||= .65;
state.daily ||= 5;
let session = [];
let index = 0;
let deferredPrompt = null;

function save() {
  localStorage.setItem('kinaState', JSON.stringify(state));
  updateStats();
}

function show(id) {
  $$('.screen').forEach(x => x.classList.remove('active'));
  $('#' + id).classList.add('active');
  if (id === 'list') renderList();
  if (id === 'settings') loadSettings();
}

function updateStats() {
  const learned = Object.values(state.scores).filter(x => x >= 2).length;
  $('#learnedCount').textContent = learned;
  $('#dueCount').textContent = words.length - learned;
  $('#streak').textContent = state.days || 1;
}

$$('[data-go]').forEach(b => b.onclick = () => {
  const x = b.dataset.go;
  if (x === 'learn' || x === 'review') start();
  else show(x);
});
$$('[data-home]').forEach(b => b.onclick = () => show('home'));

function start() {
  const ranked = words.map((w, i) => ({w, i, s: state.scores[i] || 0}));
  ranked.sort((a, b) => a.s - b.s || Math.random() - .5);
  session = ranked.slice(0, Number(state.daily || 5));
  index = 0;
  $('#done').classList.add('hidden');
  $('#card').classList.remove('hidden');
  show('learn');
  renderCard();
}

function renderCard() {
  const o = session[index];
  if (!o) {
    $('#card').classList.add('hidden');
    $('#done').classList.remove('hidden');
    return;
  }
  const w = o.w;
  $('#category').textContent = w.cat;
  $('#german').textContent = w.de;
  $('#english').textContent = w.en;
  $('#kinaray').textContent = w.kr;
  $('#hint').textContent = 'Aussprachehilfe: ' + w.hint;
  $('#answer').classList.add('hidden');
  $('#revealBtn').classList.remove('hidden');
  $('#progressText').textContent = `${index + 1} von ${session.length}`;
}

$('#revealBtn').onclick = () => {
  $('#answer').classList.remove('hidden');
  $('#revealBtn').classList.add('hidden');
};

$$('[data-rate]').forEach(b => b.onclick = () => {
  const o = session[index];
  const r = b.dataset.rate;
  state.scores[o.i] = r === 'easy' ? 3 : r === 'almost' ? 2 : 0;
  save();
  index++;
  renderCard();
});

function speak(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = Number(state.rate || .65);
  const voices = speechSynthesis.getVoices();
  const chosen =
    voices.find(v => v.name === state.voice) ||
    voices.find(v => /fil|philipp|female|woman|zira|samantha/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0];
  if (chosen) u.voice = chosen;
  u.lang = chosen?.lang || 'en-PH';
  speechSynthesis.speak(u);
}

$('#speakBtn').onclick = () => speak(session[index].w.kr);

function renderList(q = '') {
  const s = q.toLowerCase();
  $('#wordList').innerHTML = words
    .filter(w => [w.de, w.en, w.kr].join(' ').toLowerCase().includes(s))
    .map((w, i) => `<div class="word"><div><strong>${w.kr}</strong><span>${w.de}</span><small>${w.en} · ${w.hint}</small></div><button data-speak="${i}">Anhören</button></div>`)
    .join('');
  $$('[data-speak]').forEach(b => b.onclick = () => speak(words[b.dataset.speak].kr));
}

$('#search').oninput = e => renderList(e.target.value);

function loadVoices() {
  const vs = speechSynthesis.getVoices();
  const sel = $('#voiceSelect');
  sel.innerHTML = vs.map(v => `<option ${v.name === state.voice ? 'selected' : ''}>${v.name}</option>`).join('') || '<option>Gerätestimme</option>';
}

speechSynthesis.onvoiceschanged = loadVoices;

function loadSettings() {
  loadVoices();
  $('#dailySize').value = state.daily;
  $('#rate').value = state.rate;
}

$('#dailySize').onchange = e => {
  state.daily = Number(e.target.value);
  save();
};
$('#rate').oninput = e => {
  state.rate = Number(e.target.value);
  save();
};
$('#voiceSelect').onchange = e => {
  state.voice = e.target.value;
  save();
};
$('#testVoice').onclick = () => speak('Mayad nga aga! Salamat.');
$('#reset').onclick = () => {
  if (confirm('Wirklich den gesamten Lernfortschritt löschen?')) {
    state = {scores: {}, rate: .65, daily: 5};
    save();
    show('home');
  }
};

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  $('#installBtn').classList.remove('hidden');
});

$('#installBtn').onclick = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#installBtn').classList.add('hidden');
  }
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
updateStats();
