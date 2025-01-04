const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');

const loginButton = document.getElementById('login-button');
const agreeTerms = document.getElementById('agree-terms');

const showPassword = document.getElementById('show-password');
const showPasswordIcon = document.getElementById('show-password-icon');
const hidePasswordIcon = document.getElementById('hide-password-icon');

const usernameError = document.querySelector('.username-error');
const emailError = document.querySelector('.email-error');
const passwordError = document.querySelector('.password-error');
const termsError = document.querySelector('.terms-error');

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
});

function validate()
{
   let valid = true

   emailError.textContent = '';
   passwordError.textContent = '';
   usernameError.textContent = '';
   termsError.textContent = '';

   if(usernameInput.value === '')
   {
      usernameError.textContent = 'Username is required';
      valid = false;
   }
   else if(!validateUsername(usernameInput.value))
   {
      usernameError.textContent = 'Invalid username';
      valid = false;
   }
   

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
   else if(!validatePasswordConfirm(passwordInput.value, passwordConfirmInput.value))
   {
      passwordError.textContent = 'Passwords do not match';
      valid = false;
   }

   if(!agreeTerms.checked) 
   {
      termsError.textContent = 'You must agree to the terms and conditions';
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

function validateUsername(username) {
   const usernameRegex = /^[a-zA-Z0-9]{4,}$/;
   return usernameRegex.test(username);
}

function validatePasswordConfirm(password, passwordConfirm) {
   return password === passwordConfirm;
}

