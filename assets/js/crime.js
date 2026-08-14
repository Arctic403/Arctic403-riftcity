// Extracted crime module (uses global functions p, showModal, attemptCrime, addLog, save, render)
const Crime = (function(){
  function crime(crimeType, nerve, baseReward, successChance){
    if(window.p.jail || window.p.hospital){ addLog("You cannot commit crimes while unavailable."); return; }
    if(window.p.nerve < nerve){ addLog("Not enough nerve."); return; }
    window.p.nerve -= nerve;

    const crimeSetups = {
      'Pickpocket':{ setup: "You spot a mark in the crowd—a wealthy businessman checking his phone. You move in smoothly...",
        options:[
          {text:"Go for the wallet (high risk)", action:()=>attemptCrime(crimeType, baseReward*1.2, successChance-0.1)},
          {text:"Target the watch (medium risk)", action:()=>attemptCrime(crimeType, baseReward, successChance)},
          {text:"Play it safe with loose change", action:()=>attemptCrime(crimeType, baseReward*0.6, successChance+0.15)}
        ]},
      'Burglary':{ setup:"You case the apartment. The owner won't be back for hours.", options:[
        {text:"Stealth through fire escape", action:()=>attemptCrime(crimeType, baseReward, successChance+0.1)},
        {text:"Smash and grab through window", action:()=>attemptCrime(crimeType, baseReward*1.3, successChance-0.15)},
        {text:"Pick the front lock (slow but safe)", action:()=>attemptCrime(crimeType, baseReward*0.8, successChance+0.2)}
      ]},
      'Mugging':{ setup:"A lone pedestrian walks down the dark alley.", options:[
        {text:"Intimidate with weapon", action:()=>attemptCrime(crimeType, baseReward*1.1, successChance-0.05)},
        {text:"Quick knockout and rob", action:()=>attemptCrime(crimeType, baseReward*0.9, successChance+0.05)},
        {text:"Back off—too risky", action:()=>{ addLog("You decided it was too risky. Backed away."); save(); render(); }}
      ]}
    };

    const setup = crimeSetups[crimeType] || {setup:"Crime in progress...", options:[]};
    showModal("🎯 " + crimeType, setup.setup, setup.options.map(opt=>({text:opt.text, callback:opt.action})));
  }

  return { crime };
})();
