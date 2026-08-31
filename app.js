const STORE="vitamind_ultimate_v2";
let state=JSON.parse(localStorage.getItem(STORE)||"{}");
state.days??={}; state.reminders??=[]; state.profile??={};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const today=()=>new Date().toISOString().slice(0,10);
const getDay=(d=today())=>state.days[d]??(state.days[d]={water:0,sleep:0,activity:0});
function save(){localStorage.setItem(STORE,JSON.stringify(state)); renderHome(); renderGraph();}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function go(id){$$(".page").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.go===id)); if(id==="ingredients")renderIngredients(); if(id==="reminder")renderReminders(); if(id==="progress")renderGraph(); if(id==="learn")renderLearn(); if(id==="profile")loadProfile();scrollTo({top:0,behavior:"smooth"})}
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
function renderHome(){const d=getDay();$("#sumWater").textContent=d.water||0;$("#sumSleep").textContent=(+d.sleep||0).toFixed(1)+"h";$("#sumActivity").textContent=d.activity||0;$("#waterValue").textContent=d.water||0;$("#sumStreak").textContent=Object.values(state.days).filter(x=>x.water||x.sleep||x.activity).length}
$("#waterPlus").onclick=()=>{getDay().water++;save()}; $("#waterMinus").onclick=()=>{getDay().water=Math.max(0,getDay().water-1);save()};
$("#saveSleep").onclick=()=>{const v=+$("#sleepInput").value;if(v>=0&&v<=24){getDay().sleep=v;save();toast("Sleep saved")}else toast("Enter 0–24 hours")};
$("#saveActivity").onclick=()=>{const v=+$("#activityInput").value;if(v>=0){getDay().activity=v;save();toast("Activity saved")}else toast("Enter a valid value")};
$("#calcBMI").onclick=()=>{let w=+$("#weight").value,h=+$("#height").value/100;if(!w||!h)return toast("Enter weight and height");let b=w/(h*h),c=b<18.5?"warn":b<25?"good":b<30?"warn":"bad",l=b<18.5?"Below standard adult screening range":b<25?"Standard adult screening range":b<30?"Above standard adult screening range":"Higher adult screening range";$("#bmiResult").innerHTML=`<div class="bmi-box"><b>BMI: ${b.toFixed(1)} <span class="badge ${c}">${l}</span></b><p class="tiny muted">BMI has limitations and is not a diagnosis.</p></div>`};
async function notifications(){if(!("Notification" in window))return toast("Notifications aren't supported in this browser");let p=await Notification.requestPermission();toast(p==="granted"?"Notifications enabled":"Notification permission not granted")}
$("#notifyBtn").onclick=notifications;
$("#addReminder").onclick=async()=>{let name=$("#remName").value.trim(),time=$("#remTime").value;if(!name||!time)return toast("Add a name and time");state.reminders.push({id:Date.now(),name,time,on:true});save();$("#remName").value="";$("#remTime").value="";renderReminders();await notifications()};
function renderReminders(){$("#remList").innerHTML=state.reminders.length?state.reminders.map((r,i)=>`<div class="rem-item"><div><b>⏰ ${escapeHTML(r.name)}</b><span class="tiny muted">${r.time} · ${r.on?"Enabled":"Paused"}</span></div><div class="mini-actions"><button onclick="toggleRem(${i})">${r.on?"Pause":"Start"}</button><button onclick="delRem(${i})">×</button></div></div>`).join(""):`<div class="panel muted">No reminders yet.</div>`}
window.toggleRem=i=>{state.reminders[i].on=!state.reminders[i].on;save();renderReminders()};window.delRem=i=>{state.reminders.splice(i,1);save();renderReminders()};
function beep(){try{let c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);g.gain.value=.08;o.frequency.value=880;o.start();o.stop(c.currentTime+.35)}catch(e){}}
setInterval(()=>{let now=new Date(),hm=now.toTimeString().slice(0,5),stamp=today()+hm;state.reminders.forEach(r=>{let k="vm2_"+r.id;if(r.on&&r.time===hm&&localStorage.getItem(k)!==stamp){localStorage.setItem(k,stamp);beep();navigator.vibrate?.([200,80,200]);if(Notification.permission==="granted")new Notification("VitaMind reminder",{body:r.name});toast("⏰ "+r.name)}})},1000);
const ingredients=[
["Oats","Whole-grain cereal ingredient often used for porridge and breakfast foods."],["Rice","A cereal grain used as a staple food in many cuisines."],["Milk","A dairy product; check labels for ingredients and allergens."],["Yogurt","Cultured dairy food; varieties differ in sugar and protein."],["Egg","A common food ingredient and one of the major allergens for some people."],["Soy","Used in foods such as tofu and soy milk; check labels for allergens."],["Peanut","A legume and a common allergen for some people."],["Almond","A tree nut used whole or as flour/milk; allergies are possible."],["Lentil","A pulse commonly used in soups and curries."],["Chickpea","A pulse used in hummus and many cooked dishes."],["Apple","A fruit commonly eaten fresh or used in sauces and baking."],["Banana","A fruit often used as a snack or ingredient."],["Orange","A citrus fruit containing vitamin C among other nutrients."],["Mango","A tropical fruit with natural sweetness."],["Tomato","A fruit commonly used as a vegetable in cooking."],["Potato","A starchy tuber used in many foods."],["Carrot","A root vegetable commonly eaten raw or cooked."],["Spinach","A leafy vegetable used in salads and cooked dishes."],["Broccoli","A cruciferous vegetable."],["Garlic","A pungent ingredient used for flavor."],["Ginger","A rhizome used as a spice and flavoring."],["Turmeric","A yellow spice used in many dishes."],["Cinnamon","An aromatic spice; concentrated products are different from culinary use."],["Cocoa","A cacao-derived ingredient used in chocolate products."],["Sugar","A sweetener; product labels show the specific type and amount."],["Salt","Used for flavor and preservation; labels may list sodium."],["Honey","A sweet food made by bees."],["Olive oil","A cooking oil made from olives."],["Butter","A dairy fat used in cooking and baking."],["Chicken","A poultry ingredient; safe handling and cooking are important."],["Fish","A broad food category; species and preparation vary."],["Tofu","A soy-based food."],["Beans","A broad group of legumes."],["Peas","A green legume used fresh, frozen, or dried."],["Corn","A cereal grain and vegetable used in many foods."],["Quinoa","A seed commonly prepared like a grain."],["Barley","A cereal grain containing gluten."],["Pasta","Usually wheat-based; check labels for ingredients."],["Bread","Ingredients vary by product and may include common allergens."],["Coffee","A beverage ingredient containing caffeine in typical forms."],["Tea","A brewed beverage; varieties and caffeine content vary."],["Lemon","A citrus fruit used for flavor."],["Coconut","Used as fruit, milk, water, or oil in different products."],["Avocado","A fruit with a creamy texture."],["Cucumber","A commonly eaten fresh vegetable-like fruit."],["Blueberry","A small berry often eaten fresh or frozen."],["Strawberry","A berry-like fruit and potential allergen for a small number of people."],["Pumpkin","A squash used in savory and sweet dishes."],["Sesame","A seed and recognized allergen in many places."],["Mustard","A condiment ingredient and allergen for some people."]];
function escapeHTML(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function renderIngredients(){let q=$("#ingredientSearch").value.toLowerCase();$("#ingredientList").innerHTML=ingredients.filter(x=>x[0].toLowerCase().includes(q)).map(x=>`<article class="ingredient-item"><b>🥗 ${x[0]}</b><p class="muted tiny">${x[1]}</p></article>`).join("")||`<div class="panel muted">No matching ingredient found.</div>`}
$("#ingredientSearch").oninput=renderIngredients;
function renderGraph(){let a=[];for(let i=6;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let k=d.toISOString().slice(0,10),x=state.days[k]||{},score=Math.min(100,(x.water||0)*7+(x.sleep||0)*7+(x.activity||0)/3);a.push([d.toLocaleDateString(undefined,{weekday:"short"}),score])}$("#graph").innerHTML=a.map(([n,s])=>`<div class="bar-day"><div class="bar" style="height:${Math.max(8,s*2.05)}px"></div><span>${n}</span></div>`).join("")}
let stream=null;
$("#openCamera").onclick=async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});$("#cameraVideo").srcObject=stream;$("#cameraVideo").hidden=false;$("#capturePhoto").hidden=false;$("#scanPreview").hidden=true;$("#barcodeStatus").textContent="Camera opened. Point at a barcode or capture the label."}catch(e){toast("Camera needs permission and HTTPS")}};
$("#capturePhoto").onclick=()=>{let v=$("#cameraVideo"),c=$("#cameraCanvas");c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);stopCamera();analyzeCanvas(c)};
$("#scanFile").onchange=e=>{let f=e.target.files[0];if(f)analyzeImageFile(f)};
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;$("#cameraVideo").hidden=true;$("#capturePhoto").hidden=true}
async function analyzeImageFile(file){
  if(!file.type.startsWith("image/")) return toast("Please choose an image file");
  try{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
      const max=1280,scale=Math.min(1,max/Math.max(img.naturalWidth||1,img.naturalHeight||1));
      const c=document.createElement("canvas");
      c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);analyzeDataURL(c.toDataURL("image/jpeg",0.82));
    };
    img.onerror=()=>{URL.revokeObjectURL(url);toast("Could not read that image")};
    img.src=url;
  }catch(e){toast("Could not prepare image")}
}
function analyzeCanvas(c){analyzeDataURL(c.toDataURL("image/jpeg",.82))}
async function readApiJson(response){
  const raw=await response.text();
  let data;
  try{data=raw?JSON.parse(raw):{}}
  catch{
    const hint=raw.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,120);
    throw new Error(`Server returned a non-JSON response${hint?": "+hint:""}. Check that the Vercel API route is deployed.`);
  }
  if(!response.ok) throw new Error(data.error||`Request failed (${response.status})`);
  return data;
}
async function analyzeDataURL(dataURL){
  $("#scanPreview").innerHTML="<span>✦</span><b>Analyzing...</b><small>Reading the image with VitaMind AI</small>";
  $("#scanPreview").hidden=false;$("#scanResult").innerHTML="";
  try{
    const r=await fetch("/api/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:dataURL})});
    const j=await readApiJson(r);
    $("#scanResult").innerHTML = renderScanResult(
  j.text || "No readable result was returned."
);
  }catch(e){
    $("#scanResult").innerHTML=`<div class="analysis">Scanner error: ${escapeHTML(e.message)}</div>`;
  }finally{
    $("#scanPreview").innerHTML="<span>✓</span><b>Scan complete</b><small>Choose another image to scan again</small>";
  }
}
$("#chatForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const q=$("#chatInput").value.trim();
  if(!q)return;
  addBubble(q,"user");$("#chatInput").value="";
  const load=addBubble("Thinking…","bot");
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});
    const j=await readApiJson(r);
    load.textContent=j.text||"I couldn't generate a response.";
  }catch(err){
    load.textContent="AI error: "+err.message;
  }
});
function addBubble(t,role){let x=document.createElement("div");x.className="bubble "+role;x.textContent=t;$("#chat").append(x);$("#chat").scrollTop=$("#chat").scrollHeight;return x}
$$(".suggestions button").forEach(b=>b.onclick=()=>{$("#chatInput").value=b.textContent;$("#chatForm").requestSubmit()});
const learn=[
["🥗","Nutrition Basics","Balanced eating, food variety, and what labels can tell you.","A balanced eating pattern can include a variety of food groups and should fit individual needs, culture, availability, and medical guidance."],
["💧","Hydration","General information about fluids and everyday hydration.","Fluid needs vary with climate, activity, age, and health. Water is a common choice; follow professional advice for medical conditions."],
["😴","Sleep","Why routines and sleep habits matter.","A consistent schedule, a comfortable sleep environment, and reducing late distractions can support healthy sleep habits. Persistent sleep problems deserve professional advice."],
["🏃","Physical Activity","Building movement into everyday life.","Movement can be accumulated through daily activities, walking, sports, and exercise. Increase intensity gradually and choose activities appropriate for you."],
["🧠","Mental Wellbeing","Everyday strategies for managing stress.","Supportive relationships, routines, rest, enjoyable activities, and asking for help can all matter. Severe or persistent distress should be discussed with a trusted qualified professional."],
["❤️","Heart Health Basics","Lifestyle factors and general awareness.","Activity, food patterns, sleep, and avoiding tobacco can affect long-term health. Personal risk and medical decisions require a healthcare professional."],
["🦴","Bones & Muscles","Movement and nutrition basics.","Weight-bearing and strengthening activities may support musculoskeletal health when appropriate. Individual exercise needs can differ."],
["🧪","Vitamins & Minerals","Understanding micronutrients.","Micronutrients have specific roles, but more is not automatically better. Food sources and supplement needs vary; avoid self-prescribing high doses."],
["🏷️","Reading Food Labels","How to look at packaged foods.","Compare serving information, ingredient lists, allergen statements, and nutrient values. Use the actual package as the source of truth."],
["🧼","Food Safety","Simple habits for safer food handling.","Keep hands and surfaces clean, separate raw and ready-to-eat foods, follow storage instructions, and cook foods appropriately."],
["⚖️","Understanding BMI","What BMI can and cannot tell you.","BMI is calculated from height and weight and is used as a population screening measure. It does not directly measure body composition or diagnose health."],
["🩺","When to Seek Help","Recognizing limits of health apps.","Apps and AI cannot replace urgent or professional care. Seek help from a qualified healthcare professional for serious, sudden, or worrying symptoms."]
];
function renderLearn(){$("#learnGrid").innerHTML=learn.map((x,i)=>`<article class="learn-card" data-learn="${i}"><span class="emoji">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join("");$$("[data-learn]").forEach(el=>el.onclick=()=>{let x=learn[+el.dataset.learn],old=$(".learn-detail");if(old)old.remove();let d=document.createElement("div");d.className="learn-detail";d.innerHTML=`<b>${x[0]} ${x[1]}</b><br>${x[3]}`;el.insertAdjacentElement("afterend",d)})}
function loadProfile(){$("#profileName").value=state.profile.name||"";$("#profileGoal").value=state.profile.goal||"";$("#avatar").textContent=(state.profile.name||"V")[0].toUpperCase()}
$("#saveProfile").onclick=()=>{state.profile={name:$("#profileName").value.trim(),goal:$("#profileGoal").value.trim()};save();loadProfile();$("#profileStatus").textContent="Profile saved.";toast("Profile saved")};$("#clearProfile").onclick=()=>{state.profile={};save();loadProfile();$("#profileStatus").textContent="Profile cleared."};
$("#themeBtn").onclick=()=>document.body.classList.toggle("light");
let deferred;addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("#installBtn").hidden=false});$("#installBtn").onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$("#installBtn").hidden=true};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
renderHome();renderIngredients();renderReminders();renderGraph();renderLearn();loadProfile();
function renderScanResult(text){
  const sections = [
    ["PRODUCT", "scan-product", "📦"],
    ["INGREDIENTS", "scan-ingredients", "🥗"],
    ["POSITIVE SIDES", "scan-positive", "✅"],
    ["NEGATIVE SIDES", "scan-negative", "⚠️"],
    ["NUTRITION SNAPSHOT", "scan-nutrition", "📊"],
    ["ALLERGENS", "scan-allergens", "🚨"],
    ["BASIC TERMS EXPLAINED", "scan-terms", "💡"],
    ["QUICK TAKE", "scan-quick", "✨"]
  ];

  let html = "";

  sections.forEach(([title, cls, icon], i) => {
    const start = text.indexOf(title);
    if(start === -1) return;

    const next = sections
      .slice(i + 1)
      .map(x => text.indexOf(x[0], start + title.length))
      .find(x => x !== -1);

    const content = text
      .slice(start + title.length, next === undefined ? text.length : next)
      .trim();

    if(!content) return;

    const formatted = escapeHTML(content)
      .replace(/\n/g, "<br>");

    html += `
      <section class="scan-card ${cls}">
        <div class="scan-card-title">
          <span class="scan-card-icon">${icon}</span>
          <span>${title}</span>
        </div>
        <div class="scan-card-content">${formatted}</div>
      </section>
    `;
  });

  return html || `
    <section class="scan-card scan-product">
      <div class="scan-card-content">${escapeHTML(text)}</div>
    </section>
  `;
}
