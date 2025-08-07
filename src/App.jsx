import React, { useEffect, useState } from "react";

// Fully self‑contained, canvas‑safe version
// - No DOM querying (no document.getElementById)
// - No external libs
// - Inline CSS + SVG goo
// - Default export only
// - 2s feedback delay; shows ✓/✖ and highlights correct answer

// ============ Brand ============
const BRAND = { primary: "#0f9187", primaryDark: "#0b2d3a", accent: "#f39c12", bg: "#0b2d3a" };

// ============ Seed Questions (12) ============
// difficulty: 1..5; the picker will ramp 1,1,2,2,2,3,3,4,4,5
const SEED_QUESTIONS = [
  { id: "q1",  difficulty: 1, prompt: "What do we call deposits that form when oil cools and insolubles precipitate?", choices: ["Cold varnish","Hot varnish","EP plating","Babbitt creep"], answerIndex: 0 },
  { id: "q2",  difficulty: 1, prompt: "Which test trends soluble degradation products (varnish potential)?", choices: ["Karl Fischer","Membrane Patch Colorimetry (MPC)","Viscosity Index","Particle Count only"], answerIndex: 1 },
  { id: "q3",  difficulty: 2, prompt: "Hot varnish from shear stress most often initiates at which bearing location?", choices: ["Reservoir headspace","Minimum oil‑film thickness / high load zone","Shaft ends only","Only in coolers"], answerIndex: 1 },
  { id: "q4",  difficulty: 2, prompt: "An early indicator for deposit interference in bearings is a temperature trend that looks like…", choices: ["Flat line","Sawtooth spikes","Perfect sine wave","No change"], answerIndex: 1 },
  { id: "q5",  difficulty: 2, prompt: "Why can bulk‑oil analysis (e.g., MPC/UC) miss some hot varnish events?", choices: ["Antioxidants hide it completely","Deposits form locally and adhere before affecting bulk oil","It only happens in storage drums","Thermocouples are too slow"], answerIndex: 1 },
  { id: "q6",  difficulty: 3, prompt: "THD modeling suggests varnish deposits generally ____ minimum film thickness and ____ local temperature.", choices: ["increase; decrease","decrease; increase","decrease; decrease","do not affect; do not affect"], answerIndex: 1 },
  { id: "q7",  difficulty: 3, prompt: "Which pair most strongly influences the likelihood of shear‑stress deposits?", choices: ["Viscosity & TAN","Load & rotational speed","Reservoir color & size","Water ppm & ISO code"], answerIndex: 1 },
  { id: "q8",  difficulty: 4, prompt: "What rotor dynamic issue can follow from non‑uniform heating caused by deposits on a journal?", choices: ["Beach marks","Morton Effect instability","Hertzian pitting","Thermal ratcheting"], answerIndex: 1 },
  { id: "q9",  difficulty: 4, prompt: "Extending the circumferential arc of varnish (same thickness) generally causes maximum pressure to ____ while peak temperature stays ~____.", choices: ["rise; constant","drop; constant","drop; drop","unchanged; rise"], answerIndex: 1 },
  { id: "q10", difficulty: 5, prompt: "From an LCA perspective, which strategy best reduces a system’s total CO₂e footprint?", choices: ["Switch to Group I base oil","Extend in‑service oil life (e.g., Fill4Life)","Ship by air instead of sea","Use darker dye"], answerIndex: 1 },
  { id: "q11", difficulty: 3, prompt: "Which technique targets soft contaminants/varnish precursors more directly than particle filters?", choices: ["Magnetic rods","Electrostatic oil cleaning","Coalescers","UV curing"], answerIndex: 1 },
  { id: "q12", difficulty: 2, prompt: "RULER (voltammetry) is primarily used to assess which property?", choices: ["Water content","Remaining antioxidants","Viscosity index","Acid number only"], answerIndex: 1 }
];

// ============ Helpers ============
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function pickTenProgressive(bank){ const by={}; bank.forEach(q=>{ (by[q.difficulty] ||= []).push(q);}); const plan=[1,1,2,2,2,3,3,4,4,5]; const picked=[]; for(const d of plan){ const pool=by[d]||[]; if(pool.length){ picked.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]); } else { const rest=bank.filter(q=>!picked.includes(q)); if(rest.length) picked.push(rest[Math.floor(Math.random()*rest.length)]); } } return picked; }
function makeBlobs(n){ return Array.from({length:n},(_,i)=>({ id:`b${i}`, x:Math.random()*70+10, y:Math.random()*70+10, r:Math.random()*10+8, alpha:0.7 })); }
function validateBank(arr){ if(!Array.isArray(arr)) throw new Error("Bank must be an array"); arr.forEach((q,i)=>{ if(!q || !q.prompt || !Array.isArray(q.choices) || typeof q.answerIndex!=="number") throw new Error(`Question ${i} malformed`); }); }

// Simple non‑fatal self‑test in dev
function runSelfTests(){ try{ validateBank(SEED_QUESTIONS); const s=pickTenProgressive(SEED_QUESTIONS); console.assert(s.length===10,"Expected 10 questions"); } catch(e){ console.warn("Self‑test:",e); } }

export default function FluitecVarnishCleaner(){
  useEffect(()=>{ runSelfTests(); },[]);

  const [adminOpen,setAdminOpen]=useState(false);
  const [adminText,setAdminText]=useState("");
  const [bank,setBank]=useState(()=>SEED_QUESTIONS);
  const [series,setSeries]=useState(()=>pickTenProgressive(SEED_QUESTIONS));
  const [round,setRound]=useState(0); // 0..9
  const [score,setScore]=useState(0);
  const [blobs,setBlobs]=useState(()=>makeBlobs(10));
  const [choices,setChoices]=useState([]);
  const [feedback,setFeedback]=useState(null); // "correct" | "wrong" | null
  const [selectedIdx,setSelectedIdx]=useState(null);

  const q=series[round];

  useEffect(()=>{ if(!q) return; setChoices(shuffle(q.choices.map((label,idx)=>({label,idx})))); setFeedback(null); setSelectedIdx(null); },[round,series]);
  useEffect(()=>{ const onKey=e=>{ if(e.key && e.key.toLowerCase()==="a") setAdminOpen(v=>!v); }; window.addEventListener("keydown",onKey); return()=>window.removeEventListener("keydown",onKey); },[]);

  function answer(idx){ if(!q||feedback) return; const correct=idx===q.answerIndex; setSelectedIdx(idx); setFeedback(correct?"correct":"wrong"); if(correct){ setScore(s=>s+1); setBlobs(bs=>bs.slice(0,-1)); } setTimeout(()=>setRound(r=>r+1),2000); }
  function restart(){ setSeries(pickTenProgressive(bank)); setBlobs(makeBlobs(10)); setRound(0); setScore(0); setFeedback(null); setSelectedIdx(null); }
  function importJSON(){ try{ const arr=JSON.parse(adminText); validateBank(arr); setBank(arr); setSeries(pickTenProgressive(arr)); setAdminOpen(false); } catch(e){ alert("Invalid JSON: "+e.message);} }

  const correctLabel = q ? q.choices[q.answerIndex] : null;

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg }}>
      <style>{`
        :root{--brand:${BRAND.primary};--brand-dark:${BRAND.primaryDark};--accent:${BRAND.accent}}
        *{box-sizing:border-box}
        body{margin:0}
        .title{color:#fff;font-weight:800;letter-spacing:.2px}
        .hud{color:#d7e9ea}
        .card{background:#ffffff;border-radius:1.25rem;box-shadow:0 10px 24px rgba(0,0,0,.25)}
        .btn{border-radius:9999px;padding:.85rem 1.1rem;font-weight:700;cursor:pointer}
        .btn:disabled{opacity:.6;cursor:not-allowed}
        .btn-primary{background:var(--brand);color:#fff;border:0}
        .btn-outline{border:2px solid var(--brand);color:var(--brand);background:transparent}
        .btn-choice{background:#fff;border:2px solid rgba(0,0,0,.06);text-align:left}
        .btn-choice:hover{border-color:var(--brand);box-shadow:0 8px 20px rgba(0,0,0,.12)}
        .metal{background: linear-gradient(120deg,#9da9b1 0%,#c6ccd1 22%,#b3bcc4 40%,#d8dee3 60%,#a8b2ba 100%);filter: contrast(1.05) saturate(0.95);position:relative;overflow:hidden;border-radius:1.5rem;}
        .goo{filter:url(#goo)}
        .blob{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(80,40,10,.9),rgba(60,30,8,.85) 40%,rgba(45,22,6,.82) 70%,rgba(30,12,3,.8))}
        .overlay-check{font-size:9rem;line-height:1}
        .choice-correct{border-color:#16a34a !important; box-shadow:0 0 0 3px rgba(22,163,74,.25)}
        .choice-wrong{border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.25)}
        @media(min-width:900px){ .grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;} }
      `}</style>

      <header className="px-6 py-5" style={{maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h1 className="title" style={{fontSize: "clamp(20px,3vw,28px)"}}>Fluitec: Varnish Cleaner</h1>
        <div className="hud" style={{fontSize: "clamp(12px,2vw,16px)"}}>Round {Math.min(round+1,10)} / 10 · Score {score}</div>
      </header>

      <main className="grid2" style={{maxWidth: "1000px", margin: "0 auto", padding: "0 24px 64px"}}>
        <section className="metal card" style={{ aspectRatio: "4 / 3" }}>
          <svg width="0" height="0"><defs><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" /><feBlend in="SourceGraphic" in2="goo" /></filter></defs></svg>
          <div className="goo" style={{position:"absolute", inset:0}}>
            {blobs.map(b=> (<div key={b.id} className="blob" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.r}vw`, height: `${b.r}vw`, opacity: b.alpha }} />))}
          </div>
          {feedback && (
            <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center"}}>
              {feedback === "correct" ? (
                <div className="overlay-check" style={{ color: "#16a34a" }}>✔</div>
              ) : (
                <div className="overlay-check" style={{ color: "#ef4444" }}>✖</div>
              )}
            </div>
          )}
        </section>

        <section className="card" style={{padding:"24px"}}>
          {!q ? (
            <div style={{textAlign:"center", padding:"40px 0"}}>
              <h2 style={{color:BRAND.primaryDark, fontSize:"22px", fontWeight:800}}>{score===10?"Spotless!":score>=7?"Factory‑clean shine":"Some goo remains"}</h2>
              <p style={{color:"#64748b", margin:"12px 0 24px"}}>Final score: {score}/10</p>
              <button className="btn btn-primary" onClick={restart}>Play again</button>
            </div>
          ) : (
            <>
              <div style={{color:BRAND.primary, fontSize:"12px", textTransform:"uppercase", fontWeight:700, marginBottom:"8px"}}>Difficulty {q.difficulty}</div>
              <h2 style={{color:BRAND.primaryDark, fontSize:"20px", fontWeight:800, marginBottom:"16px"}}>{q.prompt}</h2>
              <div style={{display:"grid", gap:"12px"}}>
                {choices.map(c=>{ const isCorrectChoice=c.idx===q.answerIndex; const isWrongPicked=!!feedback && selectedIdx===c.idx && !isCorrectChoice; const extra= feedback ? (isCorrectChoice?" choice-correct": isWrongPicked?" choice-wrong":"") : ""; return (
                  <button key={c.idx} className={`btn btn-choice${extra}`} onClick={()=>answer(c.idx)} disabled={!!feedback}>{c.label}</button>
                );})}
              </div>
              {feedback && (
                <div style={{marginTop:"12px", fontSize:"14px"}}>
                  {feedback === "correct" ? (
                    <div style={{ color: "#166534" }}><b>Correct!</b> {correctLabel}</div>
                  ) : (
                    <div style={{ color: "#991b1b" }}><b>Correct answer:</b> {correctLabel}</div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Admin overlay */}
      {adminOpen && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", zIndex:50}}>
          <div className="card" style={{width:"min(100%, 800px)", padding:"16px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
              <h3 style={{color:BRAND.primaryDark, fontWeight:800}}>Admin — Import Question Bank (JSON array)</h3>
              <button className="btn btn-outline" onClick={()=>setAdminOpen(false)}>Close</button>
            </div>
            <textarea value={adminText} onChange={e=>setAdminText(e.target.value)} placeholder='[{"id":"..","prompt":"..","choices":["A","B"],"answerIndex":0,"difficulty":2}]' style={{width:"100%",height:"260px", padding:"10px", border:"1px solid #e2e8f0", borderRadius:"12px"}} />
            <div style={{display:"flex", gap:"12px", marginTop:"10px"}}>
              <button className="btn btn-primary" onClick={importJSON}>Load</button>
              <button className="btn" style={{background:BRAND.accent, color:BRAND.primaryDark}} onClick={()=> setAdminText(JSON.stringify(SEED_QUESTIONS,null,2))}>Example</button>
            </div>
          </div>
        </div>
      )}

      <footer className="hud" style={{maxWidth:"1000px", margin:"0 auto", padding:"0 24px 40px", fontSize:"12px"}}>
        Tip: press <b>A</b> for Admin · Colors are in the BRAND constant.
      </footer>
    </div>
  );
}
