async function loadHeroReference(){
  document.body.classList.remove('hero-reference-ready');
  try{
    const files=Array.from({length:8},(_,i)=>`assets/hero-ref/${String(i).padStart(2,'0')}.txt?v=9`);
    const parts=await Promise.all(files.map(async url=>{
      const response=await fetch(url,{cache:'force-cache'});
      if(!response.ok) throw new Error(`Falha ao carregar ${url}: ${response.status}`);
      return (await response.text()).trim();
    }));
    const dataUrl='data:image/webp;base64,'+parts.join('');
    document.documentElement.style.setProperty('--hero-reference-image',`url("${dataUrl}")`);
    const mobileImage=document.querySelector('.mobile-reference-visual img');
    if(mobileImage) mobileImage.src=dataUrl;
    const preload=new Image();
    preload.onload=()=>document.body.classList.add('hero-reference-ready');
    preload.onerror=()=>document.body.classList.remove('hero-reference-ready');
    preload.src=dataUrl;
  }catch(error){
    console.error('Não foi possível carregar a arte principal STEP.',error);
    document.body.classList.remove('hero-reference-ready');
  }
}
loadHeroReference();

const scenes=[...document.querySelectorAll('.scene')],dots=[...document.querySelectorAll('.progress-dot')];let scene=0;
const navItems=[...document.querySelectorAll('.step-nav-item')];
function goToScene(n){
  scene=Math.max(0,Math.min(2,n));
  document.body.dataset.scene=String(scene);
  scenes.forEach((s,i)=>s.classList.toggle('active',i===scene));
  dots.forEach((d,i)=>d.classList.toggle('active',i===scene));
  navItems.forEach((item,i)=>item.classList.toggle('active',i===scene));
  if(scene===2&&!game.started)startGame();
}
document.querySelectorAll('.next-scene').forEach(b=>b.addEventListener('click',()=>goToScene(scene+1)));['heroStartGame','heroStartDesktop'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('click',()=>goToScene(2))});document.body.dataset.scene=String(scene);goToScene(0);
window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&scene<2)goToScene(scene+1);if(e.key==='ArrowLeft'&&scene>0)goToScene(scene-1)});
let wheelLock=false;window.addEventListener('wheel',e=>{if(innerWidth<=900||scene===2)return;if(wheelLock)return;if(Math.abs(e.deltaY)<35)return;wheelLock=true;if(e.deltaY>0&&scene<2)goToScene(scene+1);else if(e.deltaY<0&&scene>0)goToScene(scene-1);setTimeout(()=>wheelLock=false,900)},{passive:true});

const processes=[
{id:'engineering',title:'Engenharia & Desenho',image:'assets/process/game-engineering.webp',description:'Tudo começa na engenharia. Desenhos, especificações e planejamento transformam requisitos complexos em uma rota segura para a fabricação.'},
{id:'materials',title:'Separação de Materiais',image:'assets/process/game-materials.webp',description:'Rastreabilidade, identificação e organização garantem que cada material correto esteja disponível no momento certo para a produção.'},
{id:'assembly',title:'Pré-montagem de Spools',image:'assets/process/game-assembly.webp',description:'Na pré-montagem, componentes ganham forma. Alinhamento, preparação e precisão dimensional criam a base para a próxima etapa.'},
{id:'welding',title:'Soldagem',image:'assets/process/game-welding.webp',description:'Procedimentos controlados, profissionais qualificados e inspeção rigorosa fazem da soldagem uma etapa essencial da confiabilidade do conjunto.'},
{id:'inspection',title:'Inspeção & Qualidade',image:'assets/process/game-inspection.webp',description:'Inspeção visual, dimensional e rastreabilidade confirmam conformidade e qualidade antes do avanço do processo.'},
{id:'heat',title:'Tratamento Térmico',image:'assets/process/game-heat.webp',description:'Quando aplicável, o tratamento térmico controla propriedades e tensões do material para atender aos requisitos técnicos do projeto.'},
{id:'paint',title:'Pintura & Proteção',image:'assets/process/game-painting.webp',description:'Preparação de superfície e pintura protegem o equipamento contra ambientes agressivos e aumentam sua durabilidade.'},
{id:'fabrication',title:'Fabricação Industrial',image:'assets/process/game-fabrication.webp',description:'Fabricação, montagem e acabamento conectam engenharia e produção com precisão, segurança e controle do início ao fim.'}
];
const game={started:false,first:null,second:null,lock:false,moves:0,pairs:0,seconds:0,timer:null};
const board=document.getElementById('board'),movesEl=document.getElementById('moves'),pairsEl=document.getElementById('pairs'),timerEl=document.getElementById('timer');
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeCard(p){const b=document.createElement('button');b.className='memory-card';b.dataset.id=p.id;b.setAttribute('aria-label','Carta do processo '+p.title);b.innerHTML=`<div class="card-inner"><div class="card-face card-back"><img src="assets/step-logo.png" alt=""></div><div class="card-face card-front"><img class="process-img" src="${p.image}" alt="${p.title}"><img class="card-logo" src="assets/step-logo.png" alt=""><div class="card-caption"><small>PROCESSO STEP</small><strong>${p.title}</strong></div></div></div>`;b.addEventListener('click',()=>flip(b,p));return b}
function startGame(){clearInterval(game.timer);Object.assign(game,{started:true,first:null,second:null,lock:false,moves:0,pairs:0,seconds:0});movesEl.textContent='0';pairsEl.textContent='0';timerEl.textContent='00:00';board.innerHTML='';shuffle([...processes,...processes]).forEach(p=>board.appendChild(makeCard(p)));game.timer=setInterval(()=>{game.seconds++;timerEl.textContent=fmt(game.seconds)},1000)}
function flip(card,p){if(game.lock||card.classList.contains('flipped')||card.classList.contains('matched'))return;card.classList.add('flipped');if(!game.first){game.first={card,p};return}game.second={card,p};game.moves++;movesEl.textContent=game.moves;game.lock=true;if(game.first.p.id===p.id){const a=game.first.card,c=game.second.card;setTimeout(()=>{a.classList.add('matched');c.classList.add('matched');game.pairs++;pairsEl.textContent=game.pairs;showProcess(p);resetPick();if(game.pairs===processes.length){clearInterval(game.timer);setTimeout(showVictory,700)}},520)}else setTimeout(()=>{game.first.card.classList.remove('flipped');game.second.card.classList.remove('flipped');resetPick()},850)}
function resetPick(){game.first=null;game.second=null;game.lock=false}
document.getElementById('restart').addEventListener('click',startGame);

const modal=document.getElementById('processModal');function showProcess(p){document.getElementById('modalImage').src=p.image;document.getElementById('modalTitle').textContent=p.title;document.getElementById('modalDescription').textContent=p.description;modal.classList.add('show');modal.setAttribute('aria-hidden','false')}
function closeModal(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}
document.querySelector('.modal-close').addEventListener('click',closeModal);document.querySelector('.modal-continue').addEventListener('click',closeModal);document.querySelector('.modal-backdrop').addEventListener('click',closeModal);

const victory=document.getElementById('victory');function showVictory(){document.getElementById('finalTime').textContent=fmt(game.seconds);document.getElementById('finalMoves').textContent=game.moves;victory.classList.add('show');victory.setAttribute('aria-hidden','false');runConfetti()}
document.getElementById('playAgain').addEventListener('click',()=>{victory.classList.remove('show');victory.setAttribute('aria-hidden','true');startGame()});
function runConfetti(){const c=document.getElementById('confetti'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const colors=['#21b7d2','#ffffff','#f58220','#76d6e7'],parts=Array.from({length:120},()=>({x:Math.random()*c.width,y:-20-Math.random()*c.height*.4,r:3+Math.random()*5,v:2+Math.random()*5,w:Math.random()*6-3,col:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*6}));let f=0;(function anim(){x.clearRect(0,0,c.width,c.height);parts.forEach(p=>{p.y+=p.v;p.x+=p.w*.15;p.rot+=.05;x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.fillStyle=p.col;x.fillRect(-p.r,-p.r/2,p.r*2,p.r);x.restore()});if(f++<300)requestAnimationFrame(anim)})()}
