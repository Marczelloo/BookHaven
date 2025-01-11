document.addEventListener('DOMContentLoaded', () => {
   const quantityButtons = document.querySelectorAll('.quantity-button');
   const removeButtons = document.querySelectorAll('.remove-button');
   const subtotalText = document.getElementById('subtotal');
   const totalText = document.getElementById('total');
   const discountText = document.getElementById('discount');

   quantityButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
         const bookId = event.target.dataset.id;
         const action = event.target.dataset.action;

         try
         {
            const response = await fetch('/wishlist/update', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({ bookId, action })
            })

            const result = await response.json();

            if(response.ok)
            {
               if(result.newQuantity === 0)
               {
                  const cartItem = event.target.closest('.cart-item');
                  cartItem.remove();
               }
               else
               {
                  const quantityElement = event.target.parentElement.querySelector('p');
                  quantityElement.textContent = result.newQuantity;
               }

               subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
               discountText.textContent = `$${result.discount.toFixed(2)}`;
               totalText.textContent = `$${result.total.toFixed(2)}`;
            }
            else
            {
               console.error(result.message);
               showNotification(result.message, true);
            }
         }
         catch(error)
         {
            console.error('Error updating wishlist:', error);
            showNotification('Error updating wishlist', true);
         }
      })      
   });

   removeButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
         const bookId = button.dataset.id;

         try
         {
            const response = await fetch('/wishlist/remove', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({ bookId })
            })

            const result = await response.json();

            if(response.ok)
            {
               const cartItem = event.target.closest('.cart-item');
               cartItem.remove();

               subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
               discountText.textContent = `$${result.discount.toFixed(2)}`;
               totalText.textContent = `$${result.total.toFixed(2)}`;

               showNotification('Item removed from wishlist', false);
            }
            else
            {
               console.error(result.message);
               showNotification(result.message, true);
            }
         }
         catch(error)
         {
            console.error('Error removing item from wishlist:', error);
            showNotification('Error removing item from wishlist', true);
         }
      })
   });

   const clearWishlistBtn = document.getElementById('clear-wishlist');  
   const addToCartBtn = document.getElementById('add-to-cart');

   clearWishlistBtn.addEventListener('click', async () => {
      try
      {
         const response = await fetch('/wishlist/clear', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
         })

         const result = await response.json();

         if(response.ok)
         {
            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach(item => item.remove());

            subtotalText.textContent = '$0.00';
            discountText.textContent = '$0.00';
            totalText.textContent = '$0.00';

            showNotification('Wishlist cleared', false);
         }
         else
         {
            console.error(result.message);
            showNotification(result.message, true);
         }
      }
      catch(error)
      {
         console.error('Error clearing wishlist:', error);
         showNotification('Error clearing wishlist', true);
      }
   });

   addToCartBtn.addEventListener('click', async () => {
      try
      {
         const response = await fetch('/wishlist/addToCart', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
         })

         const result = await response.json();

         if(response.ok)
         {
            const cartItems = document.querySelectorAll('.cart-item');
            cartItems.forEach(item => item.remove());

            subtotalText.textContent = '$0.00';
            discountText.textContent = '$0.00';
            totalText.textContent = '$0.00';

            showNotification('Items added to cart', false);
         }
         else
         {
            console.error(result.message);
            showNotification(result.message, true);
         }
      }
      catch(error)
      {
         console.error('Error adding to cart:', error);
         showNotification('Error adding to cart', true);
      }
   });
});