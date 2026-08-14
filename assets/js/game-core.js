// Small game core refactor: expose save/load/addLog/KEY etc to be used by modules
const KEY = "riftcity_save_v4", LOGKEY = "riftcity_log_v4";
function load(){ try{ let x=JSON.parse(localStorage.getItem(KEY)); return x ? Object.assign(fresh(), x, { stats: Object.assign(fresh().stats, x.stats||{}), inventory:x.inventory||{}, crimes:x.crimes||{} }) : fresh(); }catch{return fresh();} }
function save(){ localStorage.setItem(KEY, JSON.stringify(p)); }
function logs(){ try{return JSON.parse(localStorage.getItem(LOGKEY)||"[]"); }catch{return [];} }
function addLog(s){ let a=logs(); a.unshift(new Date().toLocaleTimeString()+" • "+s); localStorage.setItem(LOGKEY, JSON.stringify(a.slice(0,50))); }
// keep other functions in index.html for now (minimal change)
