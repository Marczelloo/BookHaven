const reviews_popup = document.querySelector('.reviews');
const reviews_open = document.getElementById('reviews-btn');
const reviews_close = document.querySelector('.review-close');
const addToCartBtn = document.getElementById('addToCart');
const wishlistBtn = document.getElementById('wishlist');

reviews_open.addEventListener('click', () => {
   reviews_popup.classList.add('active');
});

reviews_close.addEventListener('click', () => {
   reviews_popup.classList.remove('active');
});

const quantity = document.getElementById('quantity');
const quantity_increase = document.getElementById('quantity-increase');
const quantity_decrease = document.getElementById('quantity-decrease');

quantity_increase.addEventListener('click', () => {   
   if(parseInt(quantity.innerText) == 10) return;
   quantity.innerText = parseInt(quantity.innerText) + 1;
});

quantity_decrease.addEventListener('click', () => {
   if(parseInt(quantity.innerText) == 1) return;
   quantity.innerText = parseInt(quantity.innerText) - 1;
   
});

const review_stars_inner = document.getElementById('review-stars-inner');
const review_stars = document.getElementById('review-stars');
const stars = Array.from(review_stars.children);

stars.forEach((star, index) => {
   star.addEventListener('click', () => {
      review_stars_inner.style.width = `${(index + 1) * 20}%`;
   });
})

addToCartBtn.addEventListener('click', async () => {
   try
   {
      const response = await fetch('/cart/add', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         },
         body: JSON.stringify({
            bookId: addToCartBtn.dataset.id,
            quantity: parseInt(quantity.innerText)
         }),
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const result = isJson ? await response.json() : {};

      if(response.ok)
      {
         showNotification('Item added to cart', false);
      }
      else if(response.status === 401)
      {
         showNotification('Please sign in to add book to cart', true);
      }
      else
      {
         showNotification(result.message, true);
      }
   }
   catch(error)
   {
      console.log(error);
      showNotification('An error occurred. Please try again later!', true);
   }
});

wishlistBtn.addEventListener('click', async () => {
   try
   {
      const response = await fetch('/wishlist/add', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         },
         body: JSON.stringify({
            bookId: wishlistBtn.dataset.id,
            quantity: parseInt(quantity.innerText)
         }),
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const result = isJson ? await response.json() : {};

      if(response.ok)
      {
         showNotification('Item added to wishlist', false);
      }
      else if(response.status === 401)
      {
         showNotification('Please sign in to add book to wishlist', true);
      }
      else
      {
         showNotification(result.message, true);
      }
   }
   catch(error)
   {
      console.log(error);
      showNotification('An error occurred. Please try again later!', true);
   }
});
