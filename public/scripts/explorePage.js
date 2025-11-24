document.addEventListener('DOMContentLoaded', () => {
   const createCarousel = (trackId, nextButtonId, prevButtonId) => {
      const track = document.getElementById(trackId);
      const slides = Array.from(track.children);
      const nextButton = document.getElementById(nextButtonId);
      const prevButton = document.getElementById(prevButtonId);
      const slideGap = parseFloat(getComputedStyle(track).gap);
      const slideWidth = slides[0].getBoundingClientRect().width + slideGap;
      const slidesToShow = 3;
      let currentIndex = 0;
   
      slides[0].classList.add('current-slide');
   
      const setSlidePosition = (slide, index) => {
         slide.style.left = slideWidth * index + 'px';
      }
   
      slides.forEach(setSlidePosition);
   
      const moveToSlide = (track, currentIndex) => {
         const targetSlide = slides[currentIndex];
         track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
         track.querySelector('.current-slide').classList.remove('current-slide');
         targetSlide.classList.add('current-slide');
      };
   
      nextButton.addEventListener('click', e => {
         if (currentIndex < slides.length - slidesToShow) {
            currentIndex++;
         } else {
            currentIndex = 0;
         }
         moveToSlide(track, currentIndex);
      });
   
      prevButton.addEventListener('click', e => {
         if (currentIndex > 0) {
            currentIndex--;
         } else {
            currentIndex = slides.length - slidesToShow;
         }
         moveToSlide(track, currentIndex);
      });
   };
   
   createCarousel('featured-books', 'featured-books-next', 'featured-books-prev');
   createCarousel('popular-books', 'popular-books-next', 'popular-books-prev');
   createCarousel('new-books', 'new-books-next', 'new-books-prev');
   createCarousel('top-books', 'top-books-next', 'top-books-prev');
   createCarousel('promotions-books', 'promotions-books-next', 'promotions-books-prev');

   addToCartButtons = document.querySelectorAll('.add-to-cart');
   wishlistButtons = document.querySelectorAll('.wishlist-button');

   addToCartButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
         event.preventDefault();

         const bookId = event.target.dataset.id;

         try {
            const response = await fetch('/cart/add', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
               },
               body: JSON.stringify({ bookId, quantity: 1 })
            });

            const isJson = response.headers.get('content-type')?.includes('application/json');
            const result = isJson ? await response.json() : {};

            if (response.ok) 
            {
               showNotification('Book added to cart', false);
            } 
            else 
            {
               if(response.status === 401)
               {
                  showNotification('Please sign in to add book to cart', true);
               }
               else
               {
                  showNotification(result.message || 'Failed to add book to cart', true);
               }
            }
         } catch (error) {
            console.error('Error updating cart:', error);
            showNotification('An error occurred while adding the book to your cart', true);
         }
      });
   });

   wishlistButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
         event.preventDefault();

         const bookId = button.dataset.id;

         try {
            const response = await fetch('/wishlist/add', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
               },
               body: JSON.stringify({ bookId, quantity: 1 })
            });

            const isJson = response.headers.get('content-type')?.includes('application/json');
            const result = isJson ? await response.json() : {};

            if (response.ok) 
            {
               showNotification('Book added to wishlist', false);
            } 
            else 
            {
               if(response.status === 401)
               {
                  showNotification('Please sign in to add book to wishlist', true);
               }
               else
               {
                  showNotification(result.message || 'Failed to add book to wishlist', true);
               }
            } 
         } 
         catch (error) 
         {
            console.error('Error updating wishlist:', error);
            showNotification('An error occurred while adding the book to your wishlist', true);
         }
      });
   });
});
