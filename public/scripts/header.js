document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".input-search");
  const searchResultsContainer = document.querySelector(".search-results");
  const profileButton = document.querySelector(".profile-button");
  const userMenuPopup = document.querySelector(".user-menu-popup");

  // Demo Disclaimer Modal Logic
  const disclaimerModal = document.getElementById("demo-disclaimer");
  const acceptButton = document.getElementById("accept-disclaimer");

  if (disclaimerModal && acceptButton) {
    // Check if user has already seen the disclaimer
    const hasSeenDisclaimer = localStorage.getItem("bookhaven-disclaimer-accepted");

    if (!hasSeenDisclaimer) {
      disclaimerModal.style.display = "flex";
      document.body.style.overflow = "hidden"; // Prevent scrolling
    }

    acceptButton.addEventListener("click", function () {
      localStorage.setItem("bookhaven-disclaimer-accepted", "true");
      disclaimerModal.style.display = "none";
      document.body.style.overflow = ""; // Restore scrolling
    });
  }

  // Profile menu click toggle for mobile
  if (profileButton && userMenuPopup) {
    profileButton.addEventListener("click", function (e) {
      e.stopPropagation();
      userMenuPopup.classList.toggle("active");
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!userMenuPopup.contains(e.target) && !profileButton.contains(e.target)) {
        userMenuPopup.classList.remove("active");
      }
    });
  }

  if (!searchInput || !searchResultsContainer) return;

  searchInput.addEventListener("focus", function () {
    searchResultsContainer.classList.add("visible");
  });

  searchInput.addEventListener("blur", function () {
    setTimeout(() => {
      searchResultsContainer.classList.remove("visible");
    }, 100);
  });

  searchInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      if (searchInput.value.length < 3) return;

      const searchValue = searchInput.value;
      window.location.href = `/search?search=${searchValue}`;
    }
  });

  searchInput.addEventListener("input", async function () {
    const searchValue = searchInput.value;
    if (searchValue.length > 2) {
      const response = await fetch(`/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: searchValue }),
      });

      const results = await response.json();

      searchResultsContainer.innerHTML = "";

      if (response.ok) {
        results.books.forEach((book) => {
          const bookElement = document.createElement("a");
          bookElement.href = `/book/${book.id}`;
          bookElement.classList.add("search-result");
          bookElement.innerHTML = `
                     <img src="/assets/images/placeholder.png" alt="${book.title}">
                     <div class="search-result-info">
                        <p class='book-title'>${book.title}</p>
                        <p class='book-author'>${book.author}</p>
                     </div>
                  `;
          searchResultsContainer.appendChild(bookElement);
        });
      } else {
        console.error("Error fetching search suggestions");
      }
    } else {
      searchResultsContainer.innerHTML = "";
    }
  });
});
