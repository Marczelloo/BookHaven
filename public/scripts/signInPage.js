const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signinForm = document.getElementById('signin-form');
const loginButton = document.getElementById('login-button');
const showPassword = document.getElementById('show-password');
const showPasswordIcon = document.getElementById('show-password-icon');
const hidePasswordIcon = document.getElementById('hide-password-icon');
const emailError = document.querySelector('.email-error');
const passwordError = document.querySelector('.password-error');

showPassword.addEventListener('click', (e) => {
   e.preventDefault();
   passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
   passwordInput.placeholder = passwordInput.type === 'password' ? '********' : 'password';
   showPasswordIcon.classList.toggle('hide');
   hidePasswordIcon.classList.toggle('hide');
});

loginButton.addEventListener('click', async (e) => {
   e.preventDefault();

   if(!validate()) return;

   console.log('validation success');

   try
   {
      const response = await fetch('/user/signin', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            email: emailInput.value,
            password: passwordInput.value,
            rememberMe: document.getElementById('rememberme').checked
         }),
      })

      const result = await response.json();

      if(response.ok)
      {
         console.log('signin success');
         window.location.href = '/explore';
      }
      else
      {
         if(result.email)
         {
            emailError.textContent = result.message;
         }

         if(result.password)
         {
            passwordError.textContent = result.message;
         }
      }
   }
   catch(error)
   {
      console.log(error);
   }
});

function validate()
{
   let valid = true

   emailError.textContent = '';
   passwordError.textContent = '';


   if(emailInput.value === '') 
   {
      emailError.textContent = 'Email is required';
      valid = false;
   }
   else if(!validateEmail(emailInput.value)) 
   {
      emailError.textContent = 'Invalid email';
      valid = false;
   }

   if(passwordInput.value === '') 
   {
      passwordError.textContent = 'Password is required';
      valid = false
   }
   else if(!validatePassword(passwordInput.value)) 
   {
      passwordError.textContent = 'Invalid password';
      valid = false;
   }

   return valid;
}

function validateEmail(email) {
   const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
   return emailRegex.test(email);
}  

function validatePassword(password) {
   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
   return passwordRegex.test(password);
}

