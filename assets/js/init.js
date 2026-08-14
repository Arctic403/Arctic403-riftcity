// Minimal initialization to replace broken inline code in index.html
// Provides fresh(), page builders, basic actions, and render. Designed to be defensive.
(function(){
  // fresh default player
  function fresh(){
    return {
      name: 'Rifter', level: 1, xp: 0, cash: 500, bank: 0,
      energy: 100, maxEnergy: 100, nerve: 10, maxNerve: 10,
      health: 100, maxHealth: 100, happiness: 100, defaultHappiness: 100,
      stats: { strength: 1, defense: 1, dexterity: 1, speed: 1 },
      inventory: {}, crimes: [], lastEncounter: null
    };
  }

  // expose fresh globally if not present
  if (typeof window.fresh !== 'function') window.fresh = fresh;

  // ensure load() from game-core exists; if not, provide simple loader
  if (typeof window.load !== 'function'){
    window.load = function(){ try{ const s = localStorage.getItem('riftcity_save_v4'); return s ? Object.assign(fresh(), JSON.parse(s)) : fresh(); }catch(e){ console.error('fallback load failed', e); return fresh(); } };
  }

  // initialize player state p
  try{
    window.p = window.load ? load() : fresh();
  }catch(e){ console.error('init load failed', e); window.p = fresh(); }

  // small helpers
  window.fmt = function(n){ return Math.floor(n).toLocaleString(); };
  window.xpNeed = function(){ return Math.max(100, Math.floor(100*Math.pow(1.12, (p.level||1)-1))); };
  window.xpPct = function(){ return Math.min(100, (p.xp||0)/xpNeed()*100); };

  // showModal: simple modal using modal elements in index.html
  window.showModal = function(title, text, actions){
    try{
      const modal = document.getElementById('modal');
      if(!modal) return;
      document.getElementById('modalTitle').textContent = title || '';
      document.getElementById('modalText').textContent = text || '';
      const actionsDiv = document.getElementById('modalActions'); actionsDiv.innerHTML = '';
      (actions||[]).forEach(a=>{
        const btn = document.createElement('button'); btn.className='btn'; btn.textContent = a.text||'OK'; btn.addEventListener('click', ()=>{ try{ if(typeof a.callback === 'function') a.callback(); }catch(e){ console.error('action callback failed', e); } });
        actionsDiv.appendChild(btn);
      });
      modal.classList.add('active');
      if((actions||[]).length===0) modal.classList.remove('active');
    }catch(e){ console.error('showModal failed', e); }
  };

  // attemptCrime fallback
  window.attemptCrime = window.attemptCrime || function(type, reward, chance){
    const roll = Math.random();
    const win = roll < (chance||0.5);
    const gained = win ? Math.floor(reward||10) : 0;
    if(win){ p.cash = (p.cash||0) + gained; addLog && addLog(`Crime success: +$${gained}`); }
    else { addLog && addLog('Crime failed'); }
    try{ if(typeof save === 'function') save(); }catch(e){}
    if(typeof render === 'function') render();
  };

  // basic no-op actions to avoid missing function errors
  ['train','buy','deposit','withdraw','resetGame','equip','payBail'].forEach(name=>{ if(typeof window[name] !== 'function') window[name] = function(){ addLog && addLog(name+"() not implemented"); }; });

  // Page builders
  window.pageHome = window.pageHome || function(){
    return `
      <h1 class="title">Welcome back, ${p.name}</h1>
      <div class="subtitle">Build a character over weeks and months, not a weekend.</div>
      <div class="grid grid2">
        <div class="card">
          <h3>Overview</h3>
          <div class="meterline"><span>Level ${p.level}</span><b>${fmt(p.xp||0)} / ${fmt(xpNeed())} XP</b></div>
          <div class="bar"><i style="width:${xpPct()}%"></i></div>
          <div class="small">Cash: $${fmt(p.cash||0)}</div>
        </div>
        <div class="card">
          <h3>Last</h3>
          <div class="small">${p.lastEncounter?JSON.stringify(p.lastEncounter):'No recent events'}</div>
        </div>
      </div>
    `;
  };

  window.pageCharacter = window.pageCharacter || function(){
    return `
      <h1 class="title">Character</h1>
      <div class="subtitle">Your stats and equipment.</div>
      <div class="grid grid2">
        <div class="card">
          <h3>Stats</h3>
          <div class="stat"><span>Strength</span><b>${(p.stats.strength||0).toFixed? (p.stats.strength||0).toFixed(2) : (p.stats.strength||0)}</b></div>
          <div class="stat"><span>Defense</span><b>${(p.stats.defense||0).toFixed? (p.stats.defense||0).toFixed(2) : (p.stats.defense||0)}</b></div>
          <div class="stat"><span>Dexterity</span><b>${(p.stats.dexterity||0).toFixed? (p.stats.dexterity||0).toFixed(2) : (p.stats.dexterity||0)}</b></div>
          <div class="stat"><span>Speed</span><b>${(p.stats.speed||0).toFixed? (p.stats.speed||0).toFixed(2) : (p.stats.speed||0)}</b></div>
        </div>
        <div class="card">
          <h3>Equipment</h3>
          <div class="small">Weapon: ${p.weapon||'None'}</div>
          <div class="small">Armor: ${p.armor||'None'}</div>
        </div>
      </div>
    `;
  };

  window.pageGym = window.pageGym || function(){
    return `
      <h1 class="title">Gym</h1>
      <div class="subtitle">Train to increase stats. Costs energy.</div>
      <div class="grid grid3">
        <div class="card"><h3>Strength</h3><p class="small">Train to increase strength</p><button class="btn" onclick="train('strength')">Train Strength</button></div>
        <div class="card"><h3>Defense</h3><p class="small">Train to increase defense</p><button class="btn" onclick="train('defense')">Train Defense</button></div>
        <div class="card"><h3>Dexterity</h3><p class="small">Train to increase dexterity</p><button class="btn" onclick="train('dexterity')">Train Dexterity</button></div>
      </div>
    `;
  };

  window.pageCrime = window.pageCrime || function(){
    return `
      <h1 class="title">Crime</h1>
      <div class="subtitle">Choose your illicit activity.</div>
      <div class="grid grid3">
        <div class="card"><h3>Pickpocket</h3><p class="small">Low risk, small payout</p><button class="btn" onclick="Crime && Crime.crime ? Crime.crime('Pickpocket',2,50,0.72) : attemptCrime('Pickpocket',50,0.72)">Attempt</button></div>
        <div class="card"><h3>Burglary</h3><p class="small">Medium risk, moderate payout</p><button class="btn" onclick="Crime && Crime.crime ? Crime.crime('Burglary',6,300,0.52) : attemptCrime('Burglary',300,0.52)">Attempt</button></div>
        <div class="card"><h3>Mugging</h3><p class="small">Medium risk, quick money</p><button class="btn" onclick="Crime && Crime.crime ? Crime.crime('Mugging',4,120,0.60) : attemptCrime('Mugging',120,0.6)">Attempt</button></div>
      </div>
      <div class="card"><h3>Last outcome</h3><div class="small">${p.lastEncounter?JSON.stringify(p.lastEncounter):'None yet'}</div></div>
    `;
  };

  window.pageCity = window.pageCity || function(){
    return `
      <h1 class="title">City</h1>
      <div class="subtitle">Visit locations: Hospital, Bank, Black Market.</div>
      <div class="city-grid">
        <div class="card"><h3>Hospital</h3><p class="small">Recover health or pay for treatment.</p><button class="btn" onclick="(function(){ if(p.cash<50){ addLog('Not enough cash for treatment.'); return; } p.cash-=50; p.health=Math.min(p.maxHealth,p.health+40); addLog('Treated at hospital. -$50'); if(typeof save==='function') save(); render(); })()">Pay $50</button></div>
        <div class="card"><h3>Bank</h3><p class="small">Deposit and withdraw funds.</p><button class="btn" onclick="(function(){ if(p.cash<100){ addLog('Not enough cash to deposit'); return; } p.cash-=100; p.bank=(p.bank||0)+100; if(typeof save==='function') save(); render(); })()">Deposit $100</button><button class="btn secondary" onclick="(function(){ if((p.bank||0)<100){ addLog('Not enough in bank'); return; } p.bank-=100; p.cash=(p.cash||0)+100; if(typeof save==='function') save(); render(); })()">Withdraw $100</button></div>
        <div class="card"><h3>Black Market</h3><p class="small">Buy risky items.</p><button class="btn" onclick="(function(){ if(p.cash<200){ addLog('Not enough cash.'); return; } p.cash-=200; addLog('Bought Stolen Watch -$200'); if(typeof save==='function') save(); render(); })()">Buy Stolen Watch $200</button></div>
      </div>
    `;
  };

  window.pageMore = window.pageMore || function(){
    return `
      <h1 class="title">More</h1>
      <div class="subtitle">Settings and logs.</div>
      <div class="card">
        <h3>Actions</h3>
        <div class="action"><button class="btn" onclick="(function(){ addLog('Manual save'); if(typeof save==='function') save(); })()">Save</button><button class="btn secondary" onclick="(function(){ localStorage.clear(); location.reload(); })()">Reset</button></div>
      </div>
      <div class="card">
        <h3>Logs</h3>
        <div class="log" id="miniLog"></div>
      </div>
    `;
  };

  // render updates top stats and fills pages
  window.render = window.render || function(){
    try{
      const cashTop = document.getElementById('cashTop'); if(cashTop) cashTop.textContent = '$'+fmt(p.cash||0);
      const energyTop = document.getElementById('energyTop'); if(energyTop) energyTop.textContent = (p.energy||0)+'/'+(p.maxEnergy||0);
      const nerveTop = document.getElementById('nerveTop'); if(nerveTop) nerveTop.textContent = (p.nerve||0)+'/'+(p.maxNerve||0);
      const healthTop = document.getElementById('healthTop'); if(healthTop) healthTop.textContent = (p.health||0)+'/'+(p.maxHealth||0);
      const happyTop = document.getElementById('happyTop'); if(happyTop) happyTop.textContent = (p.happiness||0);
      // populate current pages if empty
      if(document.getElementById('home') && !document.getElementById('home').innerHTML.trim()) document.getElementById('home').innerHTML = pageHome();
      if(document.getElementById('character') && !document.getElementById('character').innerHTML.trim()) document.getElementById('character').innerHTML = pageCharacter();
      if(document.getElementById('gym') && !document.getElementById('gym').innerHTML.trim()) document.getElementById('gym').innerHTML = pageGym();
      if(document.getElementById('crime') && !document.getElementById('crime').innerHTML.trim()) document.getElementById('crime').innerHTML = pageCrime();
      if(document.getElementById('city') && !document.getElementById('city').innerHTML.trim()) document.getElementById('city').innerHTML = pageCity();
      if(document.getElementById('more') && !document.getElementById('more').innerHTML.trim()) document.getElementById('more').innerHTML = pageMore();

      const miniLog = document.getElementById('miniLog'); if(miniLog){ try{ const a = JSON.parse(localStorage.getItem('riftcity_log_v4')||'[]'); miniLog.innerHTML = (a.slice(0,20).map(l=>`<div>${l}</div>`).join('')) }catch(e){} }
    }catch(e){ console.error('render failed', e); }
  };

  // initial population and attach simple tab handler (in case game-core didn't attach)
  document.addEventListener('DOMContentLoaded', function(){
    try{
      // Basic tab wiring
      const tabs = document.getElementById('tabs');
      if(tabs){ tabs.addEventListener('click', function(e){ const btn = e.target.closest('.tab'); if(!btn) return; document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); const name = btn.dataset.page; document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active')); if(name&&document.getElementById(name)) document.getElementById(name).classList.add('active'); render(); }); }

      // populate pages
      if(document.getElementById('home')) document.getElementById('home').innerHTML = pageHome();
      if(document.getElementById('character')) document.getElementById('character').innerHTML = pageCharacter();
      if(document.getElementById('gym')) document.getElementById('gym').innerHTML = pageGym();
      if(document.getElementById('crime')) document.getElementById('crime').innerHTML = pageCrime();
      if(document.getElementById('city')) document.getElementById('city').innerHTML = pageCity();
      if(document.getElementById('more')) document.getElementById('more').innerHTML = pageMore();

      render();
    }catch(e){ console.error('init DOM failed', e); }
  });

})();
