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