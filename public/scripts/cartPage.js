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

         try {
            const response = await fetch('/cart/update', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({ bookId, action })
            });

            const result = await response.json();

            if (response.ok) 
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
               showNotification(result.message, true);
            }
         } 
         catch (error) 
         {
            console.error('Error updating cart:', error);
            showNotification('Error updating cart', true);
         }
      });
   });

   removeButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
         const bookId = button.dataset.id;

         try {
            const response = await fetch('/cart/remove', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({ bookId })
            });

            const result = await response.json();

            if (response.ok) 
            {
               const cartItem = event.target.closest('.cart-item');
               cartItem.remove();

               subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
               discountText.textContent = `$${result.discount.toFixed(2)}`;
               totalText.textContent = `$${result.total.toFixed(2)}`;
            } 
            else 
            {
               showNotification(result.message, true);
            }
         } 
         catch (error) 
         {
            console.error('Error removing book from cart:', error);
            showNotification('Error removing book from cart', true);
         }
      });
   });

   const proceedToPaymentBtn = document.getElementById('proceedToPayment');
   const nameInput = document.getElementById('name');
   const surnameInput = document.getElementById('surname');
   const phoneNumberInput = document.getElementById('phoneNumber');
   const addressInput = document.getElementById('address');
   const cityInput = document.getElementById('city');
   const countryInput = document.getElementById('country');
   const zipCodeInput = document.getElementById('zipCode');
   const useBillingCheckbox = document.getElementById('useBilling');

   const nameError = document.querySelector('.name-error');
   const surnameError = document.querySelector('.surname-error');
   const phoneNumberError = document.querySelector('.phone-number-error');
   const addressError = document.querySelector('.address-error');
   const cityError = document.querySelector('.city-error');
   const countryError = document.querySelector('.country-error');
   const zipCodeError = document.querySelector('.zip-code-error');


   proceedToPaymentBtn.addEventListener('click', async () => {
      console.log('Proceed to Payment button clicked.'); // Log button click
      const name = nameInput.value;
      const surname = surnameInput.value;
      const phoneNumber = phoneNumberInput.value;
      const address = addressInput.value;
      const city = cityInput.value;
      const country = countryInput.value;
      const zipCode = zipCodeInput.value;

      const isValid = validate();
      console.log('Validation result:', isValid); // Log validation result
      if (!isValid) return;

      console.log('Sending request to /orders/place...'); // Log before fetch
      try {
         const response = await fetch('/orders/place', { 
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, surname, phoneNumber, address, city, country, zipCode })
         });
         console.log('Received response. Status:', response.status, 'Ok:', response.ok, 'Redirected:', response.redirected, 'URL:', response.url);

         if (response.ok) {
             // Check if the fetch request followed a redirect.
             // If yes, manually navigate the browser to the final URL.
             if (response.redirected) {
                 console.log('Redirect detected, navigating to:', response.url);
                 window.location.href = response.url;
             } else {
                 // This case shouldn't happen if the server always redirects on success,
                 // but handle it just in case.
                 console.log('Server responded OK but no redirect detected. Check server logic.');
                 // Maybe show a success message but stay on the page?
                 showNotification('Order placed, but redirect failed. Please check your orders.', true);
             }
         } 
         else 
         {
            // ... existing error handling ...
            let errorResult = { message: `HTTP error! status: ${response.status}` };
            try {
                errorResult = await response.json();
            } catch (e) {
                console.error('Could not parse error response as JSON');
            }
            console.error('Error placing order:', errorResult.message);
            showNotification(errorResult.message || 'Error proceeding to payment', true);
         }

      } 
      catch (error) 
      {
         console.error('Error in fetch /orders/place:', error); // Log fetch error
         showNotification('Error proceeding to payment', true);
      }
   });

   function validate()
   {
      let valid = true;

      nameError.textContent = '';
      surnameError.textContent = '';
      phoneNumberError.textContent = '';
      addressError.textContent = '';
      cityError.textContent = '';
      countryError.textContent = '';
      zipCodeError.textContent = '';


      if(nameInput.value === '') 
      {
         nameError.textContent = 'Name is required';
         valid = false;
      }

      if(surnameInput.value === '') 
      {
         surnameError.textContent = 'Surname is required';
         valid = false;
      }

      if(phoneNumberInput.value === '') 
      {
         phoneNumberError.textContent = 'Phone number is required';
         valid = false;
      }

      if(addressInput.value === '') 
      {
         addressError.textContent = 'Address is required';
         valid = false;
      }

      if(cityInput.value === '') 
      {
         cityError.textContent = 'City is required';
         valid = false;
      }

      if(countryInput.value === '') 
      {
         countryError.textContent = 'Country is required';
         valid = false;
      }

      if(zipCodeInput.value === '') 
      {
         zipCodeError.textContent = 'Zip code is required';
         valid = false;
      }

      const validName = /^[a-zA-Z]{2,}$/.test(nameInput.value);
      if(!validName)
      {
         nameError.textContent = 'Invalid name';
         valid = false;
      }

      const validSurname = /^[a-zA-Z]{2,}$/.test(surnameInput.value);
      if(!validSurname)
      {
         surnameError.textContent = 'Invalid surname';
         valid = false;
      }

      const validPhoneNumber = /^[0-9]{9}$/.test(phoneNumberInput.value);
      if(!validPhoneNumber)
      {
         phoneNumberError.textContent = 'Invalid phone number';
         valid = false;
      }

      const validZipCode = /^[0-9]{2}-?[0-9]{3}$/.test(zipCodeInput.value);
      if(!validZipCode)
      {
         zipCodeError.textContent = 'Invalid zip code';
         valid = false;
      }

      if(addressInput.value < 3)
      {
         addressError.textContent = 'Invalid address';
         valid = false;
      }

      if(cityInput.value < 2)
      {
         cityError.textContent = 'Invalid city';
         valid = false;
      }

      if(countryInput.value < 3)
      {
         countryError.textContent = 'Invalid country';
         valid = false;
      }

      return valid;
   }
});