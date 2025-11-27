const reviews_popup = document.querySelector(".reviews");
const reviews_open = document.getElementById("reviews-btn");
const reviews_close = document.querySelector(".review-close");
const addToCartBtn = document.getElementById("addToCart");
const wishlistBtn = document.getElementById("wishlist");

reviews_open.addEventListener("click", () => {
  reviews_popup.classList.add("active");
});

reviews_close.addEventListener("click", () => {
  reviews_popup.classList.remove("active");
});

const quantity = document.getElementById("quantity");
const quantity_increase = document.getElementById("quantity-increase");
const quantity_decrease = document.getElementById("quantity-decrease");

quantity_increase.addEventListener("click", () => {
  if (parseInt(quantity.innerText) == 10) return;
  quantity.innerText = parseInt(quantity.innerText) + 1;
});

quantity_decrease.addEventListener("click", () => {
  if (parseInt(quantity.innerText) == 1) return;
  quantity.innerText = parseInt(quantity.innerText) - 1;
});

const review_stars_inner = document.getElementById("review-stars-inner");
const review_stars = document.getElementById("review-stars");
const stars = Array.from(review_stars.children);
let selectedRating = 0;

stars.forEach((star, index) => {
  star.addEventListener("click", () => {
    selectedRating = index + 1;
    review_stars_inner.style.width = `${(index + 1) * 20}%`;
  });
});

// Review form submission
const reviewForm = document.querySelector(".review-form");
const reviewTextarea = reviewForm.querySelector("textarea");
const reviewSubmitBtn = reviewForm.querySelector("button");

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (selectedRating === 0) {
    showNotification("Please select a rating", true);
    return;
  }

  // Get book ID from URL
  const bookId = window.location.pathname.split("/").pop();
  const comment = reviewTextarea.value.trim();

  try {
    const response = await fetch("/reviews/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        bookId,
        rating: selectedRating,
        comment,
      }),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const result = isJson ? await response.json() : {};

    if (response.ok) {
      showNotification("Review submitted successfully!", false);

      // Add new review to the list
      addReviewToList(result.review);

      // Update average rating display
      updateAverageRating(result.averageRating, result.reviewsCount);

      // Reset form
      reviewTextarea.value = "";
      selectedRating = 0;
      review_stars_inner.style.width = "0%";
    } else if (response.status === 401) {
      showNotification("Please sign in to submit a review", true);
    } else {
      showNotification(result.message || "Failed to submit review", true);
    }
  } catch (error) {
    console.error(error);
    showNotification("An error occurred. Please try again later!", true);
  }
});

function addReviewToList(review) {
  const reviewsList = document.querySelector(".reviews-list");
  const noReviewsMsg = reviewsList.querySelector("p:not(.review-item)");

  if (noReviewsMsg && noReviewsMsg.textContent.includes("No reviews")) {
    noReviewsMsg.remove();
  }

  // Remove 'last-review' class from previous last review
  const previousLastReview = reviewsList.querySelector(".last-review");
  if (previousLastReview) {
    previousLastReview.classList.remove("last-review");
  }

  // Use user's avatar if available, otherwise use placeholder
  const avatarSrc = review.user?.avatar || "/assets/images/placeholder.png";

  const reviewElement = document.createElement("div");
  reviewElement.classList.add("user-review", "last-review");
  reviewElement.innerHTML = `
      <img src="${avatarSrc}" alt="User Avatar">
      <div>
         <div>
            <p class="username">${review.user?.username || "You"}</p>
            <div class="stars">
               <div class="stars-inner" style="width: ${(review.rating / 5) * 100}%;">
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
               </div>
               <div class="stars-outer">
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
                  <img src="/assets/svg/star.svg" alt="Star Icon"/>
               </div>
            </div>
         </div>
         <p class="review-text">${review.comment || ""}</p>
      </div>
   `;

  // Add as first review in the list
  reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
}

function updateAverageRating(averageRating, reviewsCount) {
  const bookInfoStars = document.querySelector(".book-info .stars .stars-inner");
  const ratingText = document.querySelector(".book-info .rating-text");
  const reviewsCountElement = document.querySelector(".book-info .reviews-count");

  if (bookInfoStars) {
    bookInfoStars.style.width = `${(averageRating / 5) * 100}%`;
  }

  if (ratingText) {
    ratingText.textContent = `(${averageRating.toFixed(1)} / 5)`;
  }

  if (reviewsCountElement) {
    reviewsCountElement.textContent = `${reviewsCount} reviews`;
  }
}

addToCartBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        bookId: addToCartBtn.dataset.id,
        quantity: parseInt(quantity.innerText),
      }),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const result = isJson ? await response.json() : {};

    if (response.ok) {
      showNotification("Item added to cart", false);
    } else if (response.status === 401) {
      showNotification("Please sign in to add book to cart", true);
    } else {
      showNotification(result.message, true);
    }
  } catch (error) {
    console.log(error);
    showNotification("An error occurred. Please try again later!", true);
  }
});

wishlistBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/wishlist/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        bookId: wishlistBtn.dataset.id,
        quantity: parseInt(quantity.innerText),
      }),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const result = isJson ? await response.json() : {};

    if (response.ok) {
      showNotification("Item added to wishlist", false);
    } else if (response.status === 401) {
      showNotification("Please sign in to add book to wishlist", true);
    } else {
      showNotification(result.message, true);
    }
  } catch (error) {
    console.log(error);
    showNotification("An error occurred. Please try again later!", true);
  }
});
