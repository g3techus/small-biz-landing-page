(function () {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  function icon() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  }

  btn.textContent = icon();

  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    btn.textContent = icon();
    btn.classList.remove("spin");
    void btn.offsetWidth;
    btn.classList.add("spin");
  });
})();
