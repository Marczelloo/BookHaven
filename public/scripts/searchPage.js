const sortBySelect = document.getElementById('sortBySelect');
const sortByOptionsContainer = document.getElementById('sortByOptions');
const sortByOptions = sortByOptionsContainer.querySelectorAll('.option');
const sortByText = sortBySelect.querySelector('span');

sortBySelect.addEventListener('click', () => {
      sortByOptionsContainer.classList.toggle('active');
});

sortByOptions.forEach(option => {
      option.addEventListener('click', () => {
            sortByText.innerHTML = option.innerHTML;
            option.classList.add('selected');
            sortByOptions.forEach(oldOption => {
               console.log(oldOption.innerHTML);
               if (option !== oldOption) {
                     oldOption.classList.remove('selected');
               }
            });
      });
})

const ascButton = document.querySelector('.sort-button');

ascButton.addEventListener('click', () => { 
   ascButton.classList.toggle('asc');
});

const clearFiltersBtn = document.querySelector('.clear-params');

clearFiltersBtn.addEventListener('click', () => {
   const radioButtons = document.querySelectorAll('input[type="radio"]');
   radioButtons.forEach(radio => {
      radio.checked = false;
   });

   const minPrice = document.getElementById('minPrice');
   const maxPrice = document.getElementById('maxPrice');

   minPrice.value = parseFloat('0.00').toFixed(2);
   maxPrice.value = parseFloat('50.00').toFixed(2);
});