document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", () => {
  const isOpen = nav.style.display === "flex";
  nav.style.display = isOpen ? "none" : "flex";
  nav.style.flexDirection = "column";
  nav.style.position = "absolute";
  nav.style.top = "64px";
  nav.style.left = "0";
  nav.style.right = "0";
  nav.style.background = "#ffffff";
  nav.style.padding = "16px 24px";
  nav.style.boxShadow = "0 8px 24px rgba(16,35,62,0.08)";
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 720) {
      nav.style.display = "none";
    }
  });
});
