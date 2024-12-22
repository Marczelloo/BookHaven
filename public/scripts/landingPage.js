const firstDropdownBtn = document.getElementById('dropdown-first');
const secondDropdownBtn = document.getElementById('dropdown-second');
const thirdDropdownBtn = document.getElementById('dropdown-third');

const firstDropdown = document.querySelector('.dropdown-content-first');
const secondDropdown = document.querySelector('.dropdown-content-second');
const thirdDropdown = document.querySelector('.dropdown-content-third');

firstDropdownBtn.addEventListener('click', () => {
   firstDropdown.classList.toggle('show');
   firstDropdownBtn.classList.toggle('active');
});

secondDropdownBtn.addEventListener('click', () => {
   secondDropdown.classList.toggle('show');
   secondDropdownBtn.classList.toggle('active');
})

thirdDropdownBtn.addEventListener('click', () => {
   thirdDropdown.classList.toggle('show');
   thirdDropdownBtn.classList.toggle('active');
});