const settingsForm = document.getElementById('settings-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const avatarInput = document.getElementById('avatar');

const usernameError = document.getElementById('username-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const avatarError = document.getElementById('avatar-error');

const showPasswordButton = document.getElementById('show-password');
const showPasswordIcon = document.getElementById('show-password-icon');
const hidePasswordIcon = document.getElementById('hide-password-icon');

showPasswordButton.addEventListener('click', (e) => {
   e.preventDefault();

   passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
   passwordInput.placeholder = passwordInput.type === 'password' ? '********' : 'password';
   showPasswordIcon.classList.toggle('hide');
   hidePasswordIcon.classList.toggle('hide');
})


settingsForm.addEventListener('submit', async (e) => {
   e.preventDefault();

   if(!validate()) return;

   const formData = new FormData(settingsForm);
   
   try
   {
      const response = await fetch('/user/update', {
         method: 'POST',
         body: formData
       });
   
      const result = await response.json();
   
      if(response.ok)
      {
         console.log('update success');
         showNotification('User updated successfully, Reloading page...', false);
         setTimeout(() => {
            window.location.reload();
         }, 2000);
         window.location.href = '/profile';
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
   
         if(result.username)
         {
            usernameError.textContent = result.message;
         }
   
         if(result.avatar)
         {
            avatarError.textContent = result.message;
         }
      }
   }
   catch(error)
   {
      console.error(error);
      showNotification('Error updating user', true);
   }
});

function validate()
{
   let valid = true

   emailError.textContent = '';
   passwordError.textContent = '';
   usernameError.textContent = '';

   if(usernameInput.value && !validateUsername(usernameInput.value))
   {
      usernameError.textContent = 'Invalid username';
      valid = false;
   }
  
   if(emailInput.value && !validateEmail(emailInput.value))
   {
      emailError.textContent = 'Invalid email';
      valid = false;
   }

   if(passwordInput.value && !validatePassword(passwordInput.value))
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

function validateUsername(username) {
   const usernameRegex = /^[a-zA-Z0-9]{4,}$/;
   return usernameRegex.test(username);
}
