window.addEventListener("load", () => {
  const loading = document.getElementById("loading-screen");
  const main = document.getElementById("main-content");
  setTimeout(() => {
    loading.classList.add("hidden");
    main.classList.remove("hidden");
  }, 2500);
});

document.getElementById("messi-btn").addEventListener("click", () => {
  window.open("https://pt.wikipedia.org/wiki/Lionel_Messi", "_blank");
});

document.getElementById("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

const input = document.getElementById("user-input");
const send = document.getElementById("send-btn");
const messages = document.getElementById("messages");

send.addEventListener("click", () => {
  const msg = input.value.trim();
  if (!msg) return;

  addMessage("Você: " + msg);
  input.value = "";

  setTimeout(() => {
    addMessage("🤖 IA: " + iaResponder(msg));
  }, 600);
});

function addMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  messages.appendChild(p);
  messages.scrollTop = messages.scrollHeight;
}

function iaResponder(texto) {
  const t = texto.toLowerCase();
  if (t.includes("olá") || t.includes("oi")) return "Olá! Como posso ajudar?";
  if (t.includes("messi")) return "Messi é um dos maiores jogadores de todos os tempos!";
  if (t.includes("futebol")) return "O futebol é pura emoção! ⚽";
  if (t.includes("atualização")) return "A última atualização trouxe novos recursos visuais e IA aprimorada.";
  return "Ainda estou aprendendo 🧠, mas posso tentar te ajudar!";
}
