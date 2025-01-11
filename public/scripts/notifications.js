function showNotification(message, error = false) 
{
   const container = document.querySelector('.notification-container');

   const notification = document.createElement('div');
   notification.classList.add('notification', error && 'error');
   notification.innerText = message;

   container.appendChild(notification);

   setTimeout(() => {
      notification.remove();
   }, 4000);
}

window.showNotification = showNotification;