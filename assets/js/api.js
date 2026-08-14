// api shim for future backend
const API = {
  savePlayer: (p)=>{ localStorage.setItem("riftcity_save_v4", JSON.stringify(p)); },
  loadPlayer: ()=>{ try{return JSON.parse(localStorage.getItem("riftcity_save_v4"))}catch{return null} },
  // placeholder for multiplayer calls
  sendActionToServer: async(action,data)=>{
    // no-op for now; return fake success
    return {ok:true};
  }
};
