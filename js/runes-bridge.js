(function(){
'use strict';
function getReading(){
  try{
    var raw=sessionStorage.getItem('nyxia:aletheia:rune-reading');
    if(!raw)raw=localStorage.getItem('nyxia:aletheia:rune-reading-backup');return raw?JSON.parse(raw):null;
  }catch(e){return null}
}
function formatReading(p){
  if(!p||!Array.isArray(p.cards)||!p.cards.length)return '';
  var lines=[];
  lines.push("Je viens de faire un tirage dans l’Oracle des Runes du Portail Léna.");
  if(p.question) lines.push("Ma question : "+p.question);
  lines.push("");
  lines.push("Voici le tirage exact. Interprète uniquement ces runes, dans ces positions, sans en remplacer ni en ajouter :");
  p.cards.forEach(function(c,i){
    lines.push((i+1)+". "+c.position+" — "+c.name+" — "+c.keywords);
  });
  lines.push("");
  lines.push("Donne-moi une lecture d’Aletheia : rune par rune, puis une synthèse courte reliée à ma question. Garde le libre arbitre et évite toute certitude absolue.");
  return lines.join("\n");
}
function inject(){
  var p=getReading();
  if(!p)return;
  var msg=formatReading(p);
  if(!msg)return;
  var tries=0;
  (function waitUntilChatIsReady(){
    tries++;
    var input=document.getElementById('chat-input');
    var title=document.getElementById('chat-header-name');
    var send=document.getElementById('btn-send');
    // Attendre l'initialisation effective du chat et l'authentification.
    if(!input||!send||!title||title.textContent.trim()!=='Aletheia'){
      if(tries<90)setTimeout(waitUntilChatIsReady,300);
      return;
    }
    input.value=msg;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
    try{sessionStorage.removeItem('nyxia:aletheia:rune-reading');localStorage.removeItem('nyxia:aletheia:rune-reading-backup');}catch(e){}
    // Le message est prêt : la personne choisit « Envoyer » dans le chat.
    // Cela évite tout déclenchement prématuré avant la connexion.
  })();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);
else inject();
})();
