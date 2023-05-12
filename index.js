// const { start } = require("live-server");

const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = async () => {
    // define your method to get cart data
    const res = await fetch(`${URL}/cart`);
    return res.json();
  };

  const getInventory = async () => {
    // define your method to get inventory data
    const res = await fetch(`${URL}/inventory`);
    return res.json();
  };

  const addToCart = async (inventoryItem) => {
    // define your method to add an item to cart
    const res = await fetch(`${URL}/cart`, {
      method: "POST",
      body: JSON.stringify(inventoryItem),
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  };

  const updateCart = async (id, updatedItem) => {
    // define your method to update an item in cart
    const res = await fetch(`${URL}/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify(updatedItem),
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  };

  const deleteFromCart = async (id) => {
    // define your method to delete an item in cart
    const res = await fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
    });
    return res.json();
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange?.();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange?.();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryListEl = document.querySelector(".inventory-list");
  const cartListEl = document.querySelector(".cart-list");

  const renderInventory = (inventory) => {
    let inventoryTemplate = "";
    inventory.forEach((item) => {
      const itemTemplate = `
      <li class="inventory-item" id=${item.id}>
      <p class="inventory-item-content">${item.content}</p>
      <button class="minus-btn">-</button>
      <p class="inventory-item-quantity">${item.quantity}</p>
      <button class="plus-btn">+</button>
      <button class="add-to-cart-btn">add to cart</button>
      </li>`;
      inventoryTemplate += itemTemplate;
      inventoryListEl.innerHTML = inventoryTemplate;
    });
  };

  const renderQuantityChange = (action) => {
    const inventoryQuantityEl = document.querySelector(
      ".inventory-item-quantity"
    );
    if (action === "minus") {
      if (inventoryQuantityEl.innerText > 0) inventoryQuantityEl.innerText--;
    }
    if (action === "plus") inventoryQuantityEl.innerText++;
  };

  const getItemInfo = () => {
    const inventoryItemEl = document.querySelector(".inventory-item");
    const itemContentEl = inventoryItemEl.querySelector(
      ".inventory-item-content"
    );
    const itemQuantityEl = inventoryItemEl.querySelector(
      ".inventory-item-quantity"
    );
    const itemToAdd = {
      content: itemContentEl.innerText,
      quantity: itemQuantityEl.innerText,
      // id: inventoryItemEl.id,
    };
    return itemToAdd;
  };

  const renderCart = (cart) => {
    let CartTemplate = "";
    cart.forEach((item) => {
      const itemTemplate = `
      <li class="cart-item">
      <p class="cart-item-content">${item.content}</p>
      <p>x</p>
      <p class="cart-item-quantity">${item.quantity}</p>
      <button class="delete-btn">delete</button>
      </li>`;
      CartTemplate += itemTemplate;
      cartListEl.innerHTML = CartTemplate;
    });
  };

  return {
    inventoryListEl,
    renderInventory,
    renderCart,
    renderQuantityChange,
    getItemInfo,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {
    model.getCart().then((res) => (state.cart = res.reverse()));
    model.getInventory().then((res) => {
      res.forEach((item) => (item.quantity = 0));
      state.inventory = res;
    });
  };
  const handleUpdateAmount = () => {
    view.inventoryListEl.addEventListener("click", (e) => {
      const btn = e.target;
      console.log(btn);
      if (btn.className === "minus-btn") view.renderQuantityChange("minus");
      if (btn.className === "plus-btn") view.renderQuantityChange("plus");
      if (btn.className === "add-to-cart-btn") {
        const itemToAdd = view.getItemInfo();
        const itemInCart = state.cart.find(
          (ele) => ele.content === itemToAdd.content
        );
        if (itemInCart) {
          itemToAdd.quantity =
            parseInt(itemToAdd.quantity) + parseInt(itemInCart.quantity);
          model.updateCart(itemInCart.id, itemToAdd).then((data) => {
            state.cart = state.cart.map((ele) =>
              ele.content === data.content
                ? { ...ele, quantity: data.quantity }
                : ele
            );
          });
        } else
          model
            .addToCart(itemToAdd)
            .then((data) => (state.cart = [data, ...state.cart]));
      }
    });
  };

  const handleAddToCart = () => {
    // view.inventoryItemEl?.addEventListener("click", (e) => {
    //   console.log(e);
    // });
  };

  const handleDelete = () => {};

  const handleCheckout = () => {};
  const bootstrap = () => {
    init();
    handleUpdateAmount(),
      handleAddToCart(),
      state.subscribe(() => {
        view.renderInventory(state.inventory);
        view.renderCart(state.cart);
      });
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
