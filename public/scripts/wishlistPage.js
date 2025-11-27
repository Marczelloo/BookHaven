document.addEventListener("DOMContentLoaded", () => {
  const quantityButtons = document.querySelectorAll(".quantity-button");
  const removeButtons = document.querySelectorAll(".remove-button");
  const moveToCartButtons = document.querySelectorAll(".move-to-cart-button");
  const subtotalText = document.getElementById("subtotal");
  const totalText = document.getElementById("total");
  const discountText = document.getElementById("discount");

  // Selection functionality
  const selectAllCheckbox = document.getElementById("select-all-wishlist");
  const moveSelectedBtn = document.getElementById("move-selected-to-cart");

  function updateMoveSelectedButton() {
    const checkedItems = document.querySelectorAll(".wishlist-item-checkbox:checked");
    moveSelectedBtn.disabled = checkedItems.length === 0;
  }

  function updateSelectAllState() {
    const allCheckboxes = document.querySelectorAll(".wishlist-item-checkbox");
    const checkedCheckboxes = document.querySelectorAll(".wishlist-item-checkbox:checked");

    if (allCheckboxes.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  // Select all checkbox
  selectAllCheckbox.addEventListener("change", () => {
    const allCheckboxes = document.querySelectorAll(".wishlist-item-checkbox");
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
    updateMoveSelectedButton();
  });

  // Individual checkboxes
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("wishlist-item-checkbox")) {
      updateSelectAllState();
      updateMoveSelectedButton();
    }
  });

  // Move selected items to cart
  moveSelectedBtn.addEventListener("click", async () => {
    const checkedItems = document.querySelectorAll(".wishlist-item-checkbox:checked");
    const bookIds = Array.from(checkedItems).map((checkbox) => checkbox.dataset.id);

    if (bookIds.length === 0) {
      showNotification("No items selected", true);
      return;
    }

    try {
      const response = await fetch("/wishlist/moveToCart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookIds }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove moved items from DOM
        checkedItems.forEach((checkbox) => {
          const cartItem = checkbox.closest(".cart-item");
          cartItem.remove();
        });

        subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
        discountText.textContent = `$${result.discount.toFixed(2)}`;
        totalText.textContent = `$${result.total.toFixed(2)}`;

        updateSelectAllState();
        updateMoveSelectedButton();
        showNotification(`${bookIds.length} item(s) moved to cart`, false);
      } else {
        console.error(result.message);
        showNotification(result.message, true);
      }
    } catch (error) {
      console.error("Error moving items to cart:", error);
      showNotification("Error moving items to cart", true);
    }
  });

  // Move individual item to cart
  moveToCartButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const bookId = button.dataset.id;

      try {
        const response = await fetch("/wishlist/moveToCart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookIds: [bookId] }),
        });

        const result = await response.json();

        if (response.ok) {
          const cartItem = button.closest(".cart-item");
          cartItem.remove();

          subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
          discountText.textContent = `$${result.discount.toFixed(2)}`;
          totalText.textContent = `$${result.total.toFixed(2)}`;

          updateSelectAllState();
          updateMoveSelectedButton();
          showNotification("Item moved to cart", false);
        } else {
          console.error(result.message);
          showNotification(result.message, true);
        }
      } catch (error) {
        console.error("Error moving item to cart:", error);
        showNotification("Error moving item to cart", true);
      }
    });
  });

  quantityButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const bookId = event.target.dataset.id;
      const action = event.target.dataset.action;

      try {
        const response = await fetch("/wishlist/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookId, action }),
        });

        const result = await response.json();

        if (response.ok) {
          if (result.newQuantity === 0) {
            const cartItem = event.target.closest(".cart-item");
            cartItem.remove();
            updateSelectAllState();
            updateMoveSelectedButton();
          } else {
            const quantityElement = event.target.parentElement.querySelector("p");
            quantityElement.textContent = result.newQuantity;
          }

          subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
          discountText.textContent = `$${result.discount.toFixed(2)}`;
          totalText.textContent = `$${result.total.toFixed(2)}`;
        } else {
          console.error(result.message);
          showNotification(result.message, true);
        }
      } catch (error) {
        console.error("Error updating wishlist:", error);
        showNotification("Error updating wishlist", true);
      }
    });
  });

  removeButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const bookId = button.dataset.id;

      try {
        const response = await fetch("/wishlist/remove", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookId }),
        });

        const result = await response.json();

        if (response.ok) {
          const cartItem = button.closest(".cart-item");
          cartItem.remove();

          subtotalText.textContent = `$${result.subtotal.toFixed(2)}`;
          discountText.textContent = `$${result.discount.toFixed(2)}`;
          totalText.textContent = `$${result.total.toFixed(2)}`;

          updateSelectAllState();
          updateMoveSelectedButton();
          showNotification("Item removed from wishlist", false);
        } else {
          console.error(result.message);
          showNotification(result.message, true);
        }
      } catch (error) {
        console.error("Error removing item from wishlist:", error);
        showNotification("Error removing item from wishlist", true);
      }
    });
  });

  const clearWishlistBtn = document.getElementById("clear-wishlist");
  const addToCartBtn = document.getElementById("add-to-cart");

  clearWishlistBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/wishlist/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        const cartItems = document.querySelectorAll(".cart-item");
        cartItems.forEach((item) => item.remove());

        subtotalText.textContent = "$0.00";
        discountText.textContent = "$0.00";
        totalText.textContent = "$0.00";

        updateSelectAllState();
        updateMoveSelectedButton();
        showNotification("Wishlist cleared", false);
      } else {
        console.error(result.message);
        showNotification(result.message, true);
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      showNotification("Error clearing wishlist", true);
    }
  });

  addToCartBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/wishlist/addToCart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        const cartItems = document.querySelectorAll(".cart-item");
        cartItems.forEach((item) => item.remove());

        subtotalText.textContent = "$0.00";
        discountText.textContent = "$0.00";
        totalText.textContent = "$0.00";

        updateSelectAllState();
        updateMoveSelectedButton();
        showNotification("Items added to cart", false);
      } else {
        console.error(result.message);
        showNotification(result.message, true);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification("Error adding to cart", true);
    }
  });
});
