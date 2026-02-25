// CONFIG JÁ DEFINIDA
const OWNER = "zimbpdf0";
const REPO  = "Pdf001";
const BRANCH = "main";
const AUDIO_ROOT = "audio";

let currentAudio = null;
let currentBtn = null;

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

function stopAll() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentBtn) {
    currentBtn.classList.remove("nowplaying");
  }
  currentAudio = null;
  currentBtn = null;
}

function play(url, btn) {
  stopAll();
  currentAudio = new Audio(url);
  currentAudio.loop = document.getElementById("loop").checked;
  currentAudio.volume = document.getElementById("volume").value;
  currentAudio.play();
  currentBtn = btn;
  btn.classList.add("nowplaying");
}

async function listDir(path) {
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(api);
  return res.json();
}

async function scan(path) {
  const items = await listDir(path);
  let files = [];
  for (let item of items) {
    if (item.type === "dir") {
      const deeper = await scan(item.path);
      files = files.concat(deeper);
    } else if (item.name.toLowerCase().endsWith(".mp3")) {
      files.push(item);
    }
  }
  return files;
}

function render(files) {
  const playlist = document.getElementById("playlist");
  playlist.innerHTML = "";

  const grouped = {};
  files.forEach(f => {
    const rel = f.path.replace(AUDIO_ROOT + "/", "");
    const folder = rel.includes("/") ? rel.split("/")[0] : "Outros";
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(f);
  });

  Object.keys(grouped).sort().forEach(folder => {
    const section = document.createElement("div");
    section.className = "section";

    const title = document.createElement("h2");
    title.textContent = folder;
    section.appendChild(title);

    grouped[folder].forEach(f => {
      const btn = document.createElement("button");
      btn.className = "track";
      btn.textContent = f.name.replace(".mp3", "").replace(/[_-]/g," ");
      btn.onclick = () => play(f.download_url, btn);
      section.appendChild(btn);
    });

    playlist.appendChild(section);
  });

  setStatus(`Encontrados ${files.length} áudios.`);
}

async function init() {
  setStatus("Carregando áudios do GitHub...");
  const files = await scan(AUDIO_ROOT);
  render(files);

  document.getElementById("stopAllBtn").onclick = stopAll;

  document.getElementById("volume").addEventListener("input", e => {
    if (currentAudio) currentAudio.volume = e.target.value;
  });

  document.getElementById("loop").addEventListener("change", e => {
    if (currentAudio) currentAudio.loop = e.target.checked;
  });
}

window.addEventListener("DOMContentLoaded", init);