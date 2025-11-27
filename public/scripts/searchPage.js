const sortBySelect = document.getElementById("sortBySelect");
const sortByOptionsContainer = document.getElementById("sortByOptions");
const sortByOptions = sortByOptionsContainer.querySelectorAll(".option");
const sortByText = sortBySelect.querySelector("span");

const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");

const byTitleBtn = document.getElementById("filterByTitleBtn");
const byAuthorBtn = document.getElementById("filterByAuthorBtn");
const byDecsBnt = document.getElementById("filterByDescBtn");

const ascButton = document.querySelector(".sort-button");
let sortOrderAsc = true;

// Filter drawer elements
const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterDrawerOverlay = document.getElementById("filterDrawerOverlay");
const paramsBar = document.getElementById("paramsBar");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const activeFiltersBadge = document.getElementById("activeFiltersBadge");
const activeFiltersDesktop = document.getElementById("activeFiltersDesktop");

// Filter group collapsible functionality
const filterGroupHeaders = document.querySelectorAll(".filter-group-header");

filterGroupHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const group = header.closest(".filter-group");
    group.classList.toggle("collapsed");
  });
});

// Filter drawer toggle
function openFilterDrawer() {
  paramsBar.classList.add("drawer-open");
  filterDrawerOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeFilterDrawer() {
  paramsBar.classList.remove("drawer-open");
  filterDrawerOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

if (filterToggleBtn) {
  filterToggleBtn.addEventListener("click", openFilterDrawer);
}

if (closeDrawerBtn) {
  closeDrawerBtn.addEventListener("click", closeFilterDrawer);
}

if (filterDrawerOverlay) {
  filterDrawerOverlay.addEventListener("click", closeFilterDrawer);
}

// Update active filters badge and tags
function updateActiveFilters() {
  let count = 0;
  const tags = [];

  // Check category
  const selectedCategory = document.querySelector('input[name="category"]:checked');
  if (selectedCategory) {
    count++;
    const label = document.querySelector(`label[for="${selectedCategory.id}"]`);
    tags.push({ type: "category", label: label ? label.textContent.trim() : "Category", id: selectedCategory.id });
  }

  // Check subcategory
  const selectedSubcategory = document.querySelector('input[name="subcategory"]:checked');
  if (selectedSubcategory) {
    count++;
    const label = document.querySelector(`label[for="${selectedSubcategory.id}"]`);
    tags.push({
      type: "subcategory",
      label: label ? label.textContent.trim() : "Subcategory",
      id: selectedSubcategory.id,
    });
  }

  // Check rating
  const selectedRating = document.querySelector('input[name="rating"]:checked');
  if (selectedRating) {
    count++;
    tags.push({ type: "rating", label: `${selectedRating.value}+ Stars`, id: selectedRating.id });
  }

  // Check price range
  if (parseFloat(minPrice.value) > 0 || parseFloat(maxPrice.value) < 50) {
    count++;
    tags.push({ type: "price", label: `$${minPrice.value} - $${maxPrice.value}` });
  }

  // Update badge
  if (activeFiltersBadge) {
    if (count > 0) {
      activeFiltersBadge.textContent = count;
      activeFiltersBadge.style.display = "block";
    } else {
      activeFiltersBadge.style.display = "none";
    }
  }

  // Update desktop tags
  if (activeFiltersDesktop) {
    activeFiltersDesktop.innerHTML = "";
    tags.forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.className = "active-filter-tag";
      tagEl.innerHTML = `${tag.label} <button data-type="${tag.type}" data-id="${tag.id || ""}">&times;</button>`;
      activeFiltersDesktop.appendChild(tagEl);

      tagEl.querySelector("button").addEventListener("click", async (e) => {
        const type = e.target.dataset.type;
        const id = e.target.dataset.id;

        if (type === "category") {
          document.getElementById(id).checked = false;
          resultsParams.category = "";
          resultsParams.subcategory = "";
          document.getElementById("subcategory").innerHTML = "<p> Select a genre to see subcategories </p>";
        } else if (type === "subcategory") {
          document.getElementById(id).checked = false;
          resultsParams.subcategory = "";
        } else if (type === "rating") {
          document.getElementById(id).checked = false;
          resultsParams.rating = 0;
        } else if (type === "price") {
          minPrice.value = "0.00";
          maxPrice.value = "50.00";
          resultsParams.minPrice = 0;
          resultsParams.maxPrice = 50;
        }

        await getResults();
        updateActiveFilters();
      });
    });
  }
}

const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get("search");

const initialResultsParams = {
  search: searchQuery,
  searchBy: "title",
  sortBy: "",
  sortOrderAsc: true,
  category: "",
  subcategory: "",
  minPrice: 0.0,
  maxPrice: 50.0,
  rating: 0,
};

let resultsParams = { ...initialResultsParams };

let books = [];

async function postJsonSafe(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const result = isJson ? await response.json() : {};
  return { response, result };
}

async function addBookToWishlist(bookId) {
  try {
    const { response, result } = await postJsonSafe("/wishlist/add", { bookId, quantity: 1 });
    if (response.ok) {
      showNotification("Added to wishlist", false);
    } else if (response.status === 401) {
      showNotification("Please sign in to add book to wishlist", true);
    } else {
      showNotification(result.message || "Failed to add book to wishlist", true);
    }
  } catch (error) {
    console.log(error);
    showNotification("Failed to add book to wishlist", true);
  }
}

async function addBookToCart(bookId) {
  try {
    const { response, result } = await postJsonSafe("/cart/add", { bookId, quantity: 1 });
    if (response.ok) {
      showNotification("Added to cart", false);
    } else if (response.status === 401) {
      showNotification("Please sign in to add book to cart", true);
    } else {
      showNotification(result.message || "Failed to add book to cart", true);
    }
  } catch (error) {
    console.log(error);
    showNotification("Failed to add book to cart", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.querySelector(".items-list");
  const bookElements = resultsContainer.querySelectorAll(".book-card");
  bookElements.forEach((bookElement) => {
    const book = {
      id: bookElement.href.split("/").pop(),
      title: bookElement.querySelector(".title").textContent.trim(),
      author: bookElement.querySelector(".author").textContent.trim(),
      rating: bookElement.querySelector(".title").dataset.rating,
      price: parseFloat(bookElement.querySelector(".price span").textContent.trim().substring(1)),
    };
    books.push(book);
  });

  const wihslistBtns = document.querySelectorAll("#addToWishlist");
  wihslistBtns.forEach((wishlistBtn) => {
    wishlistBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      addBookToWishlist(wishlistBtn.dataset.id);
    });
  });

  const addToCartBtns = document.querySelectorAll("#addToCart");
  addToCartBtns.forEach((addToCartBtn) => {
    addToCartBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      addBookToCart(addToCartBtn.dataset.id);
    });
  });
});

byTitleBtn.addEventListener("click", async () => {
  byAuthorBtn.classList.remove("selected");
  byDecsBnt.classList.remove("selected");
  byTitleBtn.classList.add("selected");

  if (resultsParams.searchBy === "title") return;

  resultsParams.searchBy = "title";

  await getResults();
});

byAuthorBtn.addEventListener("click", async () => {
  byTitleBtn.classList.remove("selected");
  byDecsBnt.classList.remove("selected");
  byAuthorBtn.classList.add("selected");

  if (resultsParams.searchBy === "author") return;

  resultsParams.searchBy = "author";

  await getResults();
});

byDecsBnt.addEventListener("click", async () => {
  byTitleBtn.classList.remove("selected");
  byAuthorBtn.classList.remove("selected");
  byDecsBnt.classList.add("selected");

  if (resultsParams.searchBy === "description") return;

  resultsParams.searchBy = "description";

  await getResults();
});

ascButton.addEventListener("click", () => {
  ascButton.classList.toggle("asc");
  sortOrderAsc = !sortOrderAsc;

  resultsParams.sortOrderAsc = sortOrderAsc;

  books.reverse();

  const resultsContainer = document.querySelector(".items-list");
  resultsContainer.innerHTML = "";
  books.forEach((book) => {
    const bookElement = document.createElement("a");
    bookElement.href = `/book/${book.id}`;
    bookElement.classList.add("book-card");
    bookElement.innerHTML = `<button class="wishlist-button">
                  <img src="assets/svg/bookmark.svg" alt="bookmark icon" class="icon">
            </button>
            <img src="/assets/images/placeholder.png" alt="Book Cover">
            <div>
                  <h3 class="title"> ${book.title} </h3>
                  <p class="author"> ${book.author} </p>
                  <p class="price"> <span> $${book.price.toFixed(2)} </span> / 1 pc </p>
            </div>
            <button class="button-primary"> Add to Cart </button>`;

    resultsContainer.appendChild(bookElement);
  });
});

sortBySelect.addEventListener("click", () => {
  sortByOptionsContainer.classList.toggle("active");
});

sortByOptions.forEach((option) => {
  option.addEventListener("click", () => {
    sortByText.innerHTML = option.innerHTML;
    option.classList.add("selected");
    sortByOptions.forEach((oldOption) => {
      if (option !== oldOption) {
        oldOption.classList.remove("selected");
      }
    });

    switch (option.innerHTML.trim()) {
      case "Price":
        sortOrderAsc ? books.sort((a, b) => a.price - b.price) : books.sort((a, b) => b.price - a.price);
        resultsParams.sortBy = "price";
        break;
      case "Rating":
        sortOrderAsc ? books.sort((a, b) => a.rating - b.rating) : books.sort((a, b) => b.rating - a.rating);
        resultsParams.sortBy = "rating";
        break;
      case "Title":
        sortOrderAsc
          ? books.sort((a, b) => a.title.localeCompare(b.title))
          : books.sort((a, b) => a.title.localeCompare(b.title));
        resultsParams.sortBy = "title";
        break;
      case "Author":
        sortOrderAsc
          ? books.sort((a, b) => a.author.localeCompare(b.author))
          : books.sort((a, b) => a.author.localeCompare(b.author));
        resultsParams.sortBy = "author";
        break;
      default:
        books.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    if (!sortOrderAsc) {
      books.reverse();
    }

    const resultsContainer = document.querySelector(".items-list");
    resultsContainer.innerHTML = "";
    books.forEach((book) => {
      const bookElement = document.createElement("a");
      bookElement.href = `/book/${book._id}`;
      bookElement.classList.add("book-card");
      bookElement.innerHTML = `<button class="wishlist-button" id="addToWishlist" data-id="${book._id}">
                        <img src="assets/svg/bookmark.svg" alt="bookmark icon" class="icon">
                  </button>
                  <img src="/assets/images/placeholder.png" alt="Book Cover">
                  <div>
                        <h3 class="title"> ${book.title} </h3>
                        <p class="author"> ${book.author} </p>
                        <p class="price"> <span> $${book.price.toFixed(2)} </span> / 1 pc </p>
                  </div>
                  <button class="button-primary" id="addToCart" data-id="${book._id}"> Add to Cart </button>`;

      resultsContainer.appendChild(bookElement);
    });

    const wihslistBtns = document.querySelectorAll("#addToWishlist");
    wihslistBtns.forEach((wishlistBtn) => {
      wishlistBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        addBookToWishlist(wishlistBtn.dataset.id);
      });
    });

    const addToCartBtns = document.querySelectorAll("#addToCart");
    addToCartBtns.forEach((addToCartBtn) => {
      addToCartBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        addBookToCart(addToCartBtn.dataset.id);
      });
    });
  });
});

minPrice.addEventListener("input", async () => {
  resultsParams.minPrice = minPrice.value;

  await getResults();
  updateActiveFilters();
});

maxPrice.addEventListener("input", async () => {
  resultsParams.maxPrice = maxPrice.value;

  await getResults();
  updateActiveFilters();
});

const clearFiltersBtn = document.querySelector(".clear-params");

clearFiltersBtn.addEventListener("click", async () => {
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => {
    radio.checked = false;
  });

  const subcategoryContainer = document.getElementById("subcategory");
  subcategoryContainer.innerHTML = "<p> Select a genre to see subcategories </p>";

  minPrice.value = parseFloat("0.00").toFixed(2);
  maxPrice.value = parseFloat("50.00").toFixed(2);

  sortByOptions.forEach((option) => {
    option.classList.remove("selected");
  });

  sortByText.innerHTML = "";

  const isInitialState = JSON.stringify(resultsParams) === JSON.stringify(initialResultsParams);

  resultsParams = { ...initialResultsParams };

  if (!isInitialState) await getResults();
  updateActiveFilters();
});

setupRadioButtons();

function clearRadioEventListeners() {
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => {
    radio.removeEventListener("change", () => {});
  });
}

function setupRadioButtons() {
  let radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => {
    radio.addEventListener("change", async () => {
      if (radio.checked) {
        if (radio.name === "category") {
          resultsParams.category = radio.value;
          resultsParams.subcategory = "";
          await getSubcategories();

          await getResults();
          updateActiveFilters();
        } else if (radio.name === "subcategory") {
          resultsParams.subcategory = radio.value;
          await getResults();
          updateActiveFilters();
        } else if (radio.name === "rating") {
          resultsParams.rating = radio.value;
          await getResults();
          updateActiveFilters();
        } else {
          return console.error("Error selecting radio button");
        }
      }
    });
  });
}

getSubcategories = async () => {
  try {
    const response = await fetch("/search/subcategories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: resultsParams.category }),
    });

    const results = await response.json();

    if (response.ok) {
      const subcategoryContainer = document.getElementById("subcategory");
      subcategoryContainer.innerHTML = "";

      results.subcategories.forEach((subcategory) => {
        const subcategoryElement = document.createElement("div");
        subcategoryElement.classList.add("radio-container");
        subcategoryElement.innerHTML = `
                              <input type="radio" name="subcategory" value="${subcategory._id}" id="${subcategory.name}" class="custom-radio">
                              <label for="${subcategory.name}">${subcategory.name}</label>
                        `;
        subcategoryContainer.appendChild(subcategoryElement);
      });

      clearRadioEventListeners();
      setupRadioButtons();
    } else {
      showNotification("Error fetching subcategories. Please try again later!", true);
      return console.error("Error fetching subcategories");
    }
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    showNotification("Error fetching subcategories. Please try again later!", true);
  }
};

getResults = async () => {
  try {
    const response = await fetch("/search/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resultsParams),
    });

    const results = await response.json();

    if (response.ok) {
      const resultsContainer = document.querySelector(".items-list");
      resultsContainer.innerHTML = "";

      books = results.books;

      results.books.forEach((book) => {
        const bookElement = document.createElement("a");
        bookElement.href = `/book/${book._id}`;
        bookElement.classList.add("book-card");

        let priceHtml = "";
        if (book.promotion) {
          priceHtml = `
            <span class="original-price">$${book.promotion.originalPrice.toFixed(2)}</span>
            <span class="promo-price">$${book.promotion.promotionalPrice.toFixed(2)}</span>
          `;
        } else {
          priceHtml = `<span>$${book.price.toFixed(2)}</span>`;
        }

        const promoBadge = book.promotion ? `<div class="promo-badge">-${book.promotion.discountPercent}%</div>` : "";

        bookElement.innerHTML = `<button class="wishlist-button" id="addToWishlist" data-id="${book._id}">
                              <img src="assets/svg/bookmark.svg" alt="bookmark icon" class="icon">
                        </button>
                        ${promoBadge}
                        <img src="/assets/images/placeholder.png" alt="Book Cover">
                        <div>
                              <h3 class="title"> ${book.title} </h3>
                              <p class="author"> ${book.author} </p>
                              <p class="price"> ${priceHtml} / 1 pc </p>
                        </div>
                        <button class="button-primary" id="addToCart" data-id="${book._id}"> Add to Cart </button>`;

        resultsContainer.appendChild(bookElement);
      });

      const wihslistBtns = document.querySelectorAll("#addToWishlist");
      wihslistBtns.forEach((wishlistBtn) => {
        wishlistBtn.addEventListener("click", async (event) => {
          event.preventDefault();
          addBookToWishlist(wishlistBtn.dataset.id);
        });
      });

      const addToCartBtns = document.querySelectorAll("#addToCart");
      addToCartBtns.forEach((addToCartBtn) => {
        addToCartBtn.addEventListener("click", async (event) => {
          event.preventDefault();
          addBookToCart(addToCartBtn.dataset.id);
        });
      });
    } else {
      console.error("Error fetching books");
      showNotification("Error fetching books. Please try again later!", true);
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    showNotification("Error fetching books. Please try again later!", true);
  }
};
