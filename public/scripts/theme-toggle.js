const toggleButton = document.getElementById('theme-toggle');
const body = document.body;

toggleButton.addEventListener('click', () => {
   if(body.classList.contains('dark-mode'))
   {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
   }
   else
   {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
   }
});

body.classList.add('dark-mode');