(function(){
'use strict';
function getReading(){
  try{
    var raw=sessionStorage.getItem('nyxia:aletheia:rune-reading');
    return raw?JSON.parse(raw):null;
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
  var input=document.getElementById('chat-input');
  if(!input){setTimeout(inject,250);return}
  var msg=formatReading(p);
  if(!msg)return;
  input.value=msg;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  sessionStorage.removeItem('nyxia:aletheia:rune-reading');

  // Laisse le chat finir son initialisation puis envoie automatiquement.
  var tries=0;
  (function sendWhenReady(){
    tries++;
    if(typeof window.sendMessage==='function'){
      try{window.sendMessage()}catch(e){}
      return;
    }
    if(tries<30)setTimeout(sendWhenReady,200);
  })();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(inject,500)});
else setTimeout(inject,500);
})();