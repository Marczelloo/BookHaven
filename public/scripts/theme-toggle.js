const toggleButton = document.getElementById('theme-toggle');
const html = document.documentElement;

function applyTheme(theme) {
  html.classList.remove('light-mode', 'dark-mode');
  html.classList.add(theme);
}

toggleButton.addEventListener('click', () => {
  let newTheme;
  if (html.classList.contains('dark-mode')) {
    newTheme = 'light-mode';
  } else {
    newTheme = 'dark-mode';
  }
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});