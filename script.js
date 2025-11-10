const btnTermos = document.getElementById("termos");
const loading = document.getElementById("loading");
const termosPage = document.getElementById("termosPage");

btnTermos.addEventListener("click", () => {
  document.querySelector(".container").style.display = "none";
  loading.style.display = "block";

  setTimeout(() => {
    loading.style.display = "none";
    termosPage.style.display = "block";
  }, 3000); // 3 segundos de "carregando"
});
