// Small game core refactor: expose save/load/addLog/KEY etc to be used by modules
const KEY = "riftcity_save_v4", LOGKEY = "riftcity_log_v4";
function load(){ try{ let x=JSON.parse(localStorage.getItem(KEY)); return x ? Object.assign(fresh(), x, { stats: Object.assign(fresh().stats, x.stats||{}), inventory:x.inventory||{}, crimes:x.crimes||{} }) : fresh(); }catch{return fresh();} }
function save(){ localStorage.setItem(KEY, JSON.stringify(p)); }
function logs(){ try{return JSON.parse(localStorage.getItem(LOGKEY)||"[]"); }catch{return [];} }
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
