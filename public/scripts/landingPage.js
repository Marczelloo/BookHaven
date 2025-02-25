document.addEventListener('DOMContentLoaded', () => {
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

   const searchInput = document.querySelector('.input-search');
   const searchResultsContainer = document.querySelector('.search-results');

   searchInput.addEventListener('focus', function() {
      searchResultsContainer.classList.add('visible');
   })

   searchInput.addEventListener('blur', function() {
      setTimeout(() => {
         searchResultsContainer.classList.remove('visible');
      }, 100);
   })

   searchInput.addEventListener('keyup', function(event) {
      if(event.key === 'Enter')
      {
         if(searchInput.value.lenght < 3) return;

         const searchValue = searchInput.value;
         window.location.href = `/search?search=${searchValue}`;
      }
   })

   searchInput.addEventListener('input', async function() {
      const searchValue = searchInput.value;
      
      if(searchValue.length > 2)
      {

         const response = await fetch('/search', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: searchValue })
         })
   
         const results = await response.json();
   
         searchResultsContainer.innerHTML = '';
   
         if(response.ok)
         {
            results.books.forEach(book => {
               const bookElement = document.createElement('a');
                  bookElement.href = `/book/${book.id}`;
                  bookElement.classList.add('search-result');
                  bookElement.innerHTML = `
                     <img src="/assets/images/placeholder.png" alt="${book.title}">
                     <div class="search-result-info">
                        <p class='book-title'>${book.title}</p>
                        <p class='book-author'>${book.author}</p>
                     </div>
                  `;
                  searchResultsContainer.appendChild(bookElement);
            })
         }
         else
         {
            console.error("Error fetching search suggestions");
         }
      }
      else
      {
         searchResultsContainer.innerHTML = '';
      }
   })

   const searchButton = document.getElementById('search-button');
   
   searchButton.addEventListener('click', () => {
      const searchValue = searchInput.value;
      window.location.href = `/search?search=${searchValue}`;
   })

})