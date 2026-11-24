/* Wizualizacja - Domki Zosia i Helenka. Ceny i zajęte terminy przykładowe, formularz niczego nie wysyła. */
const B = document.body.dataset.base || '';
const PAGE = document.body.dataset.page || '';
const $ = id => document.getElementById(id);
const IMG = name => `${B}img/${name}.jpg`;

/* Domki - ceny przykładowe do podmiany na cennik właściciela */
const CABINS = [
  {id:'a', name:'Domek 1-sypialniowy', tab:'1 sypialnia · łóżko podwójne', sub:'łóżko podwójne + pojedyncze', max:5, price:380, img:'salon-z-kuchnia-domek',
   feat:['Sypialnia: 1 łóżko podwójne i 1 pojedyncze','Salon z rozkładaną sofą','Aneks kuchenny, ekspres, toster']},
  {id:'b', name:'Domek 1-sypialniowy', tab:'1 sypialnia · 3 łóżka', sub:'3 łóżka pojedyncze', max:5, price:380, img:'aneks-kuchenny-domek',
   feat:['Sypialnia: 3 łóżka pojedyncze','Salon z rozkładaną sofą','Aneks kuchenny, lodówka, płyta']},
  {id:'c', name:'Domek 2-sypialniowy', tab:'2 sypialnie · do 6 osób', sub:'dla 2 rodzin lub większej grupy', max:6, price:490, img:'taras-domku-puck',
   feat:['2 sypialnie: łóżko podwójne i 2 pojedyncze','Salon z rozkładaną sofą','Duży stół dla 6 osób']},
];

/* Zajęte noce - przykładowe */
const BUSY = {
  a:[['2027-06-25','2027-07-04'],['2027-07-11','2027-07-25'],['2027-08-01','2027-08-16'],['2027-08-22','2027-08-29']],
  b:[['2027-07-01','2027-07-08'],['2027-07-18','2027-08-08'],['2027-08-14','2027-08-21'],['2027-06-12','2027-06-15']],
  c:[['2027-07-04','2027-07-11'],['2027-07-25','2027-08-15'],['2027-05-01','2027-05-04'],['2027-06-19','2027-06-26']],
};
const SEASON_FROM = new Date(2027,4,1), SEASON_TO = new Date(2027,8,30);
const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
const MONTHS_GEN = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

const d0 = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y,m-1,d); };
const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays = (d,n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
const nightsBetween = (a,b) => Math.round((b-a)/864e5);
const fmt = d => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
const zl = n => n.toLocaleString('pl-PL') + ' zł';
const nTxt = n => n === 1 ? 'noc' : ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100) ? 'noce' : 'nocy');
const osTxt = g => g < 5 ? 'osoby' : 'osób';
const valid = d => d instanceof Date && !isNaN(d);

const isBusyNight = (cab, d) => BUSY[cab].some(([a,b]) => d >= d0(a) && d < d0(b));
const inSeason = d => d >= SEASON_FROM && d <= SEASON_TO;
function rangeFree(cab, a, b){
  for(let d = new Date(a); d < b; d = addDays(d,1)){ if(!inSeason(d) || isBusyNight(cab,d)) return false; }
  return true;
}

let cabin = 'a', viewMonth = 6, viewYear = 2027, selIn = null, selOut = null;

/* ===== rezerwacja: wyniki wyszukiwania ===== */
function renderResults(a, b, g){
  const box = $('results'); if(!box) return;
  const n = nightsBetween(a,b);
  $('resultsHead').textContent = `Domki w terminie ${fmt(a)} - ${fmt(b)} · ${n} ${nTxt(n)} · ${g} ${osTxt(g)}`;
  box.innerHTML = CABINS.map(c => {
    const fits = g <= c.max, free = rangeFree(c.id,a,b), ok = fits && free;
    const side = ok
      ? `<span class="avail free">Wolny w tym terminie</span><div class="price"><b>${zl(n*c.price)}</b><br>za ${n} ${nTxt(n)}, ${c.price} zł / noc</div><button class="btn btn-wood" type="button" data-pick="${c.id}">Wybierz ten domek</button>`
      : `<span class="avail taken">${fits ? 'Zajęty w tym terminie' : 'Za mało miejsc'}</span><button class="btn btn-line" type="button" data-cal="${c.id}">Pokaż wolne terminy</button>`;
    return `<article class="result ${ok ? '' : 'taken'}">
      <img src="${IMG(c.img)}" alt="${c.name} w Pucku" loading="lazy" width="500" height="375">
      <div class="r-body"><span class="guests-tag">do ${c.max} osób</span><h3>${c.name}</h3><div class="muted">${c.sub}</div><ul>${c.feat.map(f => `<li>${f}</li>`).join('')}</ul></div>
      <div class="r-side">${side}</div></article>`;
  }).join('');
  box.querySelectorAll('[data-pick]').forEach(btn => btn.onclick = () => {
    cabin = btn.dataset.pick; selIn = a; selOut = b; showMonth(a); renderTabs(); renderCal(); $('kalendarz').scrollIntoView({behavior:'smooth'});
  });
  box.querySelectorAll('[data-cal]').forEach(btn => btn.onclick = () => {
    cabin = btn.dataset.cal; selIn = null; selOut = null; renderTabs(); renderCal(); $('kalendarz').scrollIntoView({behavior:'smooth'});
  });
}
function showMonth(d){ viewYear = 2027; viewMonth = Math.min(Math.max(d.getMonth(),4),7); }

/* ===== rezerwacja: kalendarz ===== */
function renderTabs(){
  const t = $('tabs'); if(!t) return;
  t.innerHTML = CABINS.map(c => `<button type="button" class="tab ${c.id===cabin?'on':''}" data-tab="${c.id}">${c.tab}</button>`).join('');
  t.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => setCabin(b.dataset.tab));
}
function monthHTML(y,m){
  const first = new Date(y,m,1), days = new Date(y,m+1,0).getDate(), offset = (first.getDay()+6)%7;
  const price = CABINS.find(c => c.id===cabin).price;
  let h = `<div class="month"><h4>${MONTHS[m]} ${y}</h4><div class="grid">`;
  ['pn','wt','śr','cz','pt','so','nd'].forEach(x => h += `<div class="dow">${x}</div>`);
  for(let i=0;i<offset;i++) h += `<div class="day empty"></div>`;
  for(let d=1; d<=days; d++){
    const dt = new Date(y,m,d);
    let cls = 'day', dis = false, lab = '';
    const canBeCheckout = selIn && !selOut && dt > selIn && rangeFree(cabin, selIn, dt);
    if(!inSeason(dt)){ cls += ' off'; dis = true; }
    else if(isBusyNight(cabin,dt) && !canBeCheckout){ cls += ' busy'; dis = true; }
    else if(key(dt) !== key(SEASON_TO)){ lab = `<small>${price}</small>`; }
    if(selIn && key(dt)===key(selIn)) cls += ' start';
    if(selOut && key(dt)===key(selOut)) cls += ' end';
    if(selIn && selOut && dt > selIn && dt < selOut) cls += ' in-range';
    h += `<button type="button" class="${cls}" ${dis?'disabled':''} data-d="${key(dt)}" aria-label="${fmt(dt)}">${d}${lab}</button>`;
  }
  return h + `</div></div>`;
}
function renderCal(){
  if(!$('months')) return;
  const m2 = (viewMonth+1)%12, y2 = viewMonth===11 ? viewYear+1 : viewYear;
  $('months').innerHTML = monthHTML(viewYear,viewMonth) + monthHTML(y2,m2);
  $('prev').disabled = viewMonth <= 4;
  $('next').disabled = viewMonth >= 7;
  document.querySelectorAll('#months .day[data-d]').forEach(b => b.addEventListener('click', () => clickDay(d0(b.dataset.d))));
  renderSummary();
}
function clickDay(d){
  if(!selIn || selOut || d <= selIn){ selIn = d; selOut = null; }
  else if(rangeFree(cabin, selIn, d)){ selOut = d; }
  else { selIn = d; selOut = null; }
  renderCal();
}
function renderSummary(){
  const c = CABINS.find(x => x.id===cabin);
  $('sumCabin').textContent = `${c.name} (do ${c.max} os.)`;
  $('sumIn').textContent = selIn ? fmt(selIn) : 'wybierz w kalendarzu';
  $('sumOut').textContent = selOut ? fmt(selOut) : (selIn ? 'kliknij dzień wyjazdu' : '-');
  const n = selIn && selOut ? nightsBetween(selIn, selOut) : 0;
  $('sumNights').textContent = n ? `${n} ${nTxt(n)}` : '-';
  $('sumTotal').textContent = n ? zl(n*c.price) : '-';
  $('bookBtn').disabled = !n;
}
function setCabin(id){ cabin = id; if(selIn && selOut && !rangeFree(id,selIn,selOut)) selOut = null; renderTabs(); renderCal(); }

if(PAGE === 'rezerwacja'){
  const P = new URLSearchParams(location.search);
  let a = d0(P.get('in') || '2027-07-10'), b = d0(P.get('out') || '2027-07-17'), g = +(P.get('g') || 4);
  if(!valid(a) || !valid(b) || !(b > a) || !inSeason(a)){ a = d0('2027-07-10'); b = d0('2027-07-17'); }
  if(!(g >= 1 && g <= 6)) g = 4;
  $('sIn').value = key(a); $('sOut').value = key(b); $('sGuests').value = String(g);
  renderResults(a,b,g);
  const wanted = CABINS.find(c => c.id === P.get('domek'));
  if(wanted){ cabin = wanted.id; if(rangeFree(cabin,a,b) && g <= wanted.max){ selIn = a; selOut = b; } }
  else { const free = CABINS.find(c => rangeFree(c.id,a,b) && g <= c.max); if(free){ cabin = free.id; selIn = a; selOut = b; } }
  showMonth(a); renderTabs(); renderCal();
  if(wanted) setTimeout(() => $('kalendarz').scrollIntoView(), 50);
  $('prev').onclick = () => { viewMonth--; renderCal(); };
  $('next').onclick = () => { viewMonth++; renderCal(); };
  $('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const na = d0($('sIn').value), nb = d0($('sOut').value), ng = +$('sGuests').value;
    if(!valid(na) || !valid(nb) || !(nb > na)){ alert('Data wyjazdu musi być po dacie przyjazdu.'); return; }
    if(!inSeason(na) || !inSeason(addDays(nb,-1))){ alert('Domki wynajmujemy w sezonie: maj - wrzesień 2027.'); return; }
    history.replaceState(null, '', `?in=${key(na)}&out=${key(nb)}&g=${ng}`);
    renderResults(na,nb,ng);
    const free = CABINS.find(c => rangeFree(c.id,na,nb) && ng <= c.max);
    if(free){ cabin = free.id; selIn = na; selOut = nb; } else { selIn = null; selOut = null; }
    showMonth(na); renderTabs(); renderCal();
    $('resultsHead').scrollIntoView({behavior:'smooth'});
  });

  /* okno rezerwacji */
  const modal = $('modal');
  $('bookBtn').onclick = () => {
    const c = CABINS.find(x => x.id===cabin), n = nightsBetween(selIn,selOut);
    $('mSummary').innerHTML = `<b>${c.name}</b> (do ${c.max} os.)<br>${fmt(selIn)} - ${fmt(selOut)} · ${n} ${nTxt(n)}<br>Razem: <b>${zl(n*c.price)}</b>`;
    $('mForm').style.display = ''; $('mOk').style.display = 'none';
    modal.classList.add('on');
  };
  $('mClose').onclick = () => modal.classList.remove('on');
  modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('on'); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') modal.classList.remove('on'); });
  $('bookForm').addEventListener('submit', e => {
    e.preventDefault(); // wizualizacja - nic nie jest wysyłane
    $('mForm').style.display = 'none'; $('mOk').style.display = 'block';
  });
}

/* ===== galeria z powiększeniem ===== */
const gal = $('gallery');
if(gal){
  const items = [...gal.querySelectorAll('button')];
  const lb = $('lb'), lbImg = $('lbImg'); let lbI = 0;
  const show = i => { lbI = (i + items.length) % items.length; const im = items[lbI].querySelector('img'); lbImg.src = im.src; lbImg.alt = im.alt; lb.classList.add('on'); };
  items.forEach((b,i) => b.onclick = () => show(i));
  $('lbPrev').onclick = () => show(lbI-1);
  $('lbNext').onclick = () => show(lbI+1);
  $('lbClose').onclick = () => lb.classList.remove('on');
  lb.addEventListener('click', e => { if(e.target === lb) lb.classList.remove('on'); });
  document.addEventListener('keydown', e => {
    if(!lb.classList.contains('on')) return;
    if(e.key === 'Escape') lb.classList.remove('on');
    if(e.key === 'ArrowRight') show(lbI+1);
    if(e.key === 'ArrowLeft') show(lbI-1);
  });
}

/* ===== oceny gości ===== */
const bars = $('bars');
if(bars){
  const SCORES = [['Personel',9.5],['Komfort',9.4],['Czystość',9.3],['Lokalizacja',9.0],['Stosunek jakości do ceny',9.0],['Udogodnienia',9.0],['Bezpłatne Wi-Fi',10]];
  bars.innerHTML = SCORES.map(([n,v]) => `<div class="bar-row"><span>${n}</span><div class="bar"><i style="width:${v*10}%"></i></div><b>${v===10?'10':v.toFixed(1).replace('.',',')}</b></div>`).join('');
}
