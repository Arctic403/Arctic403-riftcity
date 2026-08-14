// Small game core refactor: expose save/load/addLog/KEY etc to be used by modules
const KEY = "riftcity_save_v4", LOGKEY = "riftcity_log_v4";
function load(){ try{ let x=JSON.parse(localStorage.getItem(KEY)); return x ? Object.assign(fresh(), x, { stats: Object.assign(fresh().stats, x.stats||{}), inventory:x.inventory||{}, crimes:x.crimes||{}, crime:x.crime||{}, lastEncounter:x.lastEncounter||null }) : fresh(); }catch(e){ console.error('load parse error', e); return fresh(); } }
function save(){ localStorage.setItem(KEY, JSON.stringify(p)); }
function logs(){ try{return JSON.parse(localStorage.getItem(LOGKEY)||"[]"); }catch{return []; } }
function addLog(s){ let a=logs(); a.unshift(new Date().toLocaleTimeString()+" • "+s); localStorage.setItem(LOGKEY, JSON.stringify(a.slice(0,50))); }

// Defensive init: run after DOMContentLoaded to expose core action functions and attach robust tab handler
document.addEventListener('DOMContentLoaded', () => {
  function exposeAndAttach(){
    try {
      if (typeof train === 'function') window.train = train;
      if (typeof buy === 'function') window.buy = buy;
      if (typeof deposit === 'function') window.deposit = deposit;
      if (typeof withdraw === 'function') window.withdraw = withdraw;
      if (typeof resetGame === 'function') window.resetGame = resetGame;
      if (typeof save === 'function') window.save = save;
      if (typeof equip === 'function') window.equip = equip;
      if (typeof payBail === 'function') window.payBail = payBail;
      if (typeof attemptCrime === 'function') window.attemptCrime = attemptCrime;
      if (typeof Crime !== 'undefined') window.Crime = Crime;
    } catch(e) {
      console.warn('expose error', e);
    }

    try {
      // attach robust tab handler (idempotent)
      const tabs = document.getElementById('tabs');
      if (tabs) {
        // remove any existing listener by replacing node
        const newTabs = tabs.cloneNode(true);
        tabs.parentNode.replaceChild(newTabs, tabs);
        newTabs.addEventListener('click', e => {
          const btn = e.target.closest('.tab');
          if (!btn) return;
          document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
          btn.classList.add('active');
          document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active'));
          const name = btn.dataset.page;
          if (name && document.getElementById(name)) document.getElementById(name).classList.add('active');
          if (typeof render === 'function') render();
        });
      }

      // populate pages if the page builder functions exist
      if (typeof pageHome === 'function' && document.getElementById('home')) document.getElementById('home').innerHTML = pageHome();
      if (typeof pageCharacter === 'function' && document.getElementById('character')) document.getElementById('character').innerHTML = pageCharacter();
      if (typeof pageGym === 'function' && document.getElementById('gym')) document.getElementById('gym').innerHTML = pageGym();
      if (typeof pageCrime === 'function' && document.getElementById('crime')) document.getElementById('crime').innerHTML = pageCrime();
      if (typeof pageCity === 'function' && document.getElementById('city')) document.getElementById('city').innerHTML = pageCity();

      // ensure modal isn't blocking if empty
      try{
        const actionsDiv = document.getElementById('modalActions');
        if(actionsDiv && actionsDiv.children.length === 0){
          document.getElementById('modal').classList.remove('active');
        }
      }catch(e){/* ignore */}

      if (typeof render === 'function') render();
    } catch(e){ console.warn('init attach error', e); }
  }

  // slight delay to ensure inline script executed and functions are defined
  setTimeout(exposeAndAttach, 50);
});


// --- In-page dev console: capture errors and logs so users without DevTools can report issues ---
(function(){
  try{
    // Create styles
    const css = `
#devConsoleToggle{position:fixed;right:12px;bottom:12px;z-index:2000;background:var(--panel);color:var(--text);border:1px solid var(--line);padding:8px 10px;border-radius:8px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.6)}
#devConsole{position:fixed;right:12px;bottom:56px;z-index:2000;width:420px;max-height:60vh;background:var(--panel);border:1px solid var(--accent);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px rgba(0,0,0,0.6)}
#devConsoleHeader{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:linear-gradient(90deg,rgba(59,130,246,0.05),transparent)}
#devConsoleHeader b{color:var(--accent)}
#devConsoleBody{padding:10px;overflow:auto;font-family:monospace;font-size:12px;color:var(--muted);line-height:1.4}
#devConsoleBody .entry{padding:6px;border-bottom:1px solid var(--line)}
#devConsoleBody .entry.error{color:var(--bad)}
#devConsoleFooter{display:flex;gap:8px;padding:8px;border-top:1px solid var(--line)}
#devConsoleFooter button{flex:1;padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--panel2);color:var(--text);cursor:pointer}
`;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    // Create UI
    const toggle = document.createElement('button'); toggle.id='devConsoleToggle'; toggle.textContent='Console'; document.body.appendChild(toggle);

    const panel = document.createElement('div'); panel.id='devConsole'; panel.style.display='none';
    panel.innerHTML = `
      <div id="devConsoleHeader"><b>In-page Console</b><span id="devConsoleCount">0</span></div>
      <div id="devConsoleBody"></div>
      <div id="devConsoleFooter">
        <button id="devConsoleClear">Clear</button>
        <button id="devConsoleCopy">Copy</button>
      </div>
    `;
    document.body.appendChild(panel);

    const body = () => document.getElementById('devConsoleBody');
    const countEl = () => document.getElementById('devConsoleCount');

    function addEntry(msg, level){
      const container = body(); if(!container) return;
      const div = document.createElement('div'); div.className='entry '+(level||'log');
      const time = new Date().toLocaleTimeString();
      div.textContent = `[${time}] ${msg}`;
      container.prepend(div);
      const n = container.children.length; if(countEl()) countEl().textContent = n;
    }

    // Wire controls
    toggle.addEventListener('click', ()=>{ panel.style.display = panel.style.display === 'none' ? 'flex' : 'none'; });
    document.getElementById('devConsoleClear').addEventListener('click', ()=>{ const c=body(); if(c) c.innerHTML=''; if(countEl()) countEl().textContent='0'; });
    document.getElementById('devConsoleCopy').addEventListener('click', ()=>{ const c=body(); if(!c) return; const text = Array.from(c.children).map(n=>n.textContent).reverse().join('\n'); navigator.clipboard?.writeText(text).then(()=>{ addEntry('Copied console contents to clipboard','log'); }).catch(()=>{ addEntry('Copy failed','error'); }); });

    // Capture console.* and errors
    const native = { log:console.log.bind(console), info:console.info.bind(console), warn:console.warn.bind(console), error:console.error.bind(console) };
    console.log = function(...args){ try{ native.log(...args); addEntry(args.map(a=>typeof a==='object'?JSON.stringify(a):String(a)).join(' '),'log'); }catch(e){} };
    console.info = function(...args){ try{ native.info(...args); addEntry(args.join(' '),'info'); }catch(e){} };
    console.warn = function(...args){ try{ native.warn(...args); addEntry(args.join(' '),'warn'); }catch(e){} };
    console.error = function(...args){ try{ native.error(...args); addEntry(args.map(a=>typeof a==='object'?JSON.stringify(a):String(a)).join(' '),'error'); }catch(e){} };

    window.addEventListener('error', function(ev){ try{ const err = ev.error ? (ev.error.stack || ev.error.message || ev.message) : ev.message; addEntry(`ERROR ${ev.filename || ''}:${ev.lineno || ''}:${ev.colno || ''} — ${err}`,'error'); }catch(e){} });
    window.addEventListener('unhandledrejection', function(ev){ try{ const reason = ev.reason && (ev.reason.stack || ev.reason.message) ? (ev.reason.stack || ev.reason.message) : JSON.stringify(ev.reason); addEntry(`UnhandledRejection — ${reason}`,'error'); }catch(e){} });

    // Expose helper for other code to log to this console
    window.devConsole = { add: addEntry, show: ()=>{ panel.style.display='flex'; }, hide: ()=>{ panel.style.display='none'; }, toggle: ()=>{ panel.style.display = panel.style.display === 'none' ? 'flex' : 'none'; }, copy: ()=>{ document.getElementById('devConsoleCopy').click(); } };

    // Auto-open if there's an existing error in the page (best-effort)
    setTimeout(()=>{
      // if there are errors collected by console.error already (difficult to detect), just keep closed. Otherwise open on first error via listener above.
    }, 2000);

  }catch(e){ console.warn('dev console init failed', e); }
})();
