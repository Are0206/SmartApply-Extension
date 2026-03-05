// SmartApply Extension - popup.js
const API = () => document.getElementById("apiUrl").value || "http://localhost:3000";

document.addEventListener("DOMContentLoaded", loadProfile);

async function loadProfile() {
  try {
    const res = await fetch(`${API()}/api/profile`);
    const data = await res.json();
    if (data.success) {
      const p = data.data;
      document.getElementById("profileFields").innerHTML = [
        ["Nombre", `${p.nombre} ${p.apellido}`],
        ["Email", p.email],
        ["Telefono", p.telefono],
        ["Titulo", p.titulo_profesional],
      ].map(([l, v]) => `<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("");
      document.getElementById("dot").className = "dot";
      document.getElementById("statusTxt").textContent = "Conectado";
    }
  } catch {
    document.getElementById("dot").className = "dot off";
    document.getElementById("statusTxt").textContent = "Sin conexion";
    document.getElementById("profileFields").innerHTML = '<p style="font-size:11px;color:#ef4444;">No se pudo conectar</p>';
  }
}

async function handlePreview() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return addLog("No hay pestana activa");
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => Array.from(document.querySelectorAll('input[name], textarea[name]')).map(e => e.name),
    });
    const fields = results[0]?.result || [];
    const res = await fetch(`${API()}/api/profile`);
    const profile = (await res.json()).data;
    const mapping = buildMapping(profile);
    const matched = {};
    fields.forEach(f => { if (mapping[f]) matched[f] = mapping[f]; });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (data) => {
        Object.entries(data).forEach(([name, val]) => {
          const el = document.querySelector(`[name="${name}"]`);
          if (el) { el.style.outline = "2px dashed #38bdf8"; el.title = `SmartApply: ${val}`; }
        });
      },
      args: [matched],
    });
    addLog(`Preview: ${Object.keys(matched).length} campos`);
  } catch (err) { addLog("Error: " + err.message); }
}

async function handleAutofill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return addLog("No hay pestana activa");
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => Array.from(document.querySelectorAll('input[name], textarea[name]')).map(e => e.name),
    });
    const fields = results[0]?.result || [];
    const res = await fetch(`${API()}/api/profile`);
    const profile = (await res.json()).data;
    const mapping = buildMapping(profile);
    const matched = {};
    fields.forEach(f => { if (mapping[f]) matched[f] = mapping[f]; });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (data) => {
        Object.entries(data).forEach(([name, val]) => {
          const el = document.querySelector(`[name="${name}"]`);
          if (el) {
            el.value = val;
            el.style.outline = "2px solid #38bdf8";
            el.dispatchEvent(new Event("input", { bubbles: true }));
            setTimeout(() => { el.style.outline = ""; }, 2000);
          }
        });
      },
      args: [matched],
    });
    addLog(`Autocompletado: ${Object.keys(matched).length} campos`);
  } catch (err) { addLog("Error: " + err.message); }
}

function buildMapping(p) {
  return {
    nombre: p.nombre, first_name: p.nombre, apellido: p.apellido, last_name: p.apellido,
    name: `${p.nombre} ${p.apellido}`, full_name: `${p.nombre} ${p.apellido}`,
    email: p.email, correo: p.email, telefono: p.telefono, phone: p.telefono,
    linkedin: p.linkedin, portfolio: p.portfolio, website: p.portfolio,
    ubicacion: p.ubicacion, location: p.ubicacion, titulo: p.titulo_profesional,
    title: p.titulo_profesional, resumen: p.resumen, summary: p.resumen,
    habilidades: (p.habilidades || []).join(", "), skills: (p.habilidades || []).join(", "),
  };
}

function addLog(msg) {
  const el = document.getElementById("log");
  const t = new Date().toLocaleTimeString("es");
  const d = document.createElement("div");
  d.textContent = `[${t}] ${msg}`;
  el.prepend(d);
}
