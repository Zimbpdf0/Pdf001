let unlocked = false;

const amb = new Audio();
amb.loop = true;

const sfx = new Audio();
sfx.loop = false;

let audioCtx = null;

function setTilesEnabled(enabled) {
  document.querySelectorAll(".tile").forEach(btn => {
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.5";
  });
}

async function unlockAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state !== "running") {
      await audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.00001;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);

    unlocked = true;
    document.getElementById("btnUnlock").textContent = "Áudio OK ✅";
    setTilesEnabled(true);
  } catch (e) {
    alert("Não consegui ativar o áudio.");
  }
}

document.getElementById("btnUnlock").addEventListener("click", unlockAudio);

document.getElementById("stopAmb").addEventListener("click", () => {
  amb.pause();
  amb.currentTime = 0;
});

document.getElementById("stopSfx").addEventListener("click", () => {
  sfx.pause();
  sfx.currentTime = 0;
});

async function loadPlaylist() {
  const res = await fetch("playlist.json", { cache: "no-store" });
  return res.json();
}

function makeButton(item) {
  const btn = document.createElement("button");
  btn.className = "tile";
  btn.textContent = item.title;
  btn.disabled = true;
  btn.style.opacity = "0.5";

  btn.addEventListener("click", async () => {
    if (!unlocked) return;

    const player = item.type === "ambience" ? amb : sfx;

    player.pause();
    player.src = item.url;
    player.loop = !!item.loop;
    player.volume = item.volume ?? 1;

    await player.play().catch(() => {
      alert("Erro ao tocar áudio.");
    });
  });

  return btn;
}

function render(data, query = "") {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const q = query.toLowerCase();

  data.categories.forEach(cat => {
    const section = document.createElement("section");

    const title = document.createElement("h2");
    title.textContent = cat.name;
    section.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = "wrap";

    cat.items
      .filter(item => {
        const text = (item.title + " " + (item.tags || []).join(" ")).toLowerCase();
        return text.includes(q);
      })
      .forEach(item => wrap.appendChild(makeButton(item)));

    section.appendChild(wrap);
    grid.appendChild(section);
  });

  setTilesEnabled(unlocked);
}

(async () => {
  const data = await loadPlaylist();
  render(data);

  document.getElementById("search").addEventListener("input", e => {
    render(data, e.target.value);
  });
})();
