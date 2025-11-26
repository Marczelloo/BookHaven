const toggleButton = document.getElementById("theme-toggle");
const html = document.documentElement;

function applyTheme(theme, instant = false) {
  // Always add no-transition class to prevent background color animation
  html.classList.add("no-transition");

  html.classList.remove("light-mode", "dark-mode");
  html.classList.add(theme);

  // Force reflow to apply styles immediately
  void html.offsetHeight;

  // Remove no-transition after a small delay to allow instant change
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.remove("no-transition");
    });
  });
}

toggleButton.addEventListener("click", () => {
  let newTheme;
  if (html.classList.contains("dark-mode")) {
    newTheme = "light-mode";
  } else {
    newTheme = "dark-mode";
  }
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
});
