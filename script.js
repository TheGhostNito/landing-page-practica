"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-nav");

function setMenuOpen(open) {
  navigation.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menuToggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
}

menuToggle.addEventListener("click", () => setMenuOpen(!navigation.classList.contains("is-open")));
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});
document.querySelector(".site-header").addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});
window.matchMedia("(max-width: 640px)").addEventListener("change", () => setMenuOpen(false));
document.documentElement.classList.add("js");

const filters = document.querySelector(".filters");
const filterButtons = [...filters.querySelectorAll("button")];
const products = [...document.querySelectorAll(".product")];

function filterProducts(category) {
  filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === category));
  });
  products.forEach((product) => {
    product.hidden = category !== "todos" && product.dataset.category !== category;
  });
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) filterProducts(button.dataset.filter);
});
document.querySelectorAll("[data-jump-filter]").forEach((link) => {
  link.addEventListener("click", () => filterProducts(link.dataset.jumpFilter));
});
document.querySelectorAll('.hero-actions a[href="#catalogo"], .primary-nav a[href="#catalogo"]').forEach((link) => {
  link.addEventListener("click", () => filterProducts("todos"));
});
filters.hidden = false;

const bag = document.querySelector("#bolsa");
const bagButton = document.querySelector(".bag-button");
const countLabel = document.querySelector(".bag-count");
const emptyLabel = document.querySelector(".bag-empty");
const itemList = document.querySelector(".bag-items");
const totalLabel = document.querySelector(".bag-total strong");
const toast = document.querySelector(".toast");
const currency = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });
const storageKey = "recreo-bag";
const inventory = new Map(
  [...document.querySelectorAll("[data-item]")].map((element) => [
    element.dataset.item,
    { name: element.querySelector("h3").textContent, price: Number(element.dataset.price) }
  ])
);
const quantities = new Map();
let toastTimer;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey)) ?? {};
  inventory.forEach((item, id) => {
    if (Number.isSafeInteger(saved[id]) && saved[id] > 0 && saved[id] <= 99) {
      quantities.set(id, saved[id]);
    }
  });
} catch {
  // The bag is still usable in browsers that block local storage.
}

function updateQuantity(id, difference) {
  const quantity = Math.min(99, (quantities.get(id) ?? 0) + difference);
  if (quantity > 0) quantities.set(id, quantity);
  else quantities.delete(id);

  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(quantities)));
  } catch {
    // Keep the current selection in memory.
  }
  updateBag();
}

function quantityButton(id, name, difference) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.dataset.itemId = id;
  button.dataset.difference = String(difference);
  const action = difference > 0 ? "Agregar una unidad de" : "Quitar una unidad de";
  button.setAttribute("aria-label", `${action} ${name}`);
  const iconId = difference > 0 ? "#i-plus" : "#i-minus";
  button.innerHTML = `<svg class="icon" aria-hidden="true"><use href="${iconId}"/></svg>`;
  return button;
}

function updateBag() {
  let count = 0;
  let total = 0;
  const rows = document.createDocumentFragment();

  quantities.forEach((quantity, id) => {
    const item = inventory.get(id);
    count += quantity;
    total += item.price * quantity;

    const row = document.createElement("li");
    row.className = "bag-item";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.name;
    const price = document.createElement("p");
    price.textContent = currency.format(item.price * quantity);
    details.append(name, price);

    const controls = document.createElement("div");
    controls.className = "quantity";
    const amount = document.createElement("span");
    amount.textContent = quantity;
    controls.append(
      quantityButton(id, item.name, -1),
      amount,
      quantityButton(id, item.name, 1)
    );
    row.append(details, controls);
    rows.append(row);
  });

  itemList.replaceChildren(rows);
  emptyLabel.hidden = count > 0;
  countLabel.textContent = count;
  countLabel.setAttribute("aria-label", `${count} ${count === 1 ? "producto" : "productos"}`);
  bagButton.setAttribute("aria-label", `Mi bolsa, ${countLabel.getAttribute("aria-label")}`);
  totalLabel.textContent = currency.format(total);
}

function announce(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => { toast.textContent = ""; }, 2600);
}

document.querySelectorAll(".add-button").forEach((button) => {
  const id = button.closest("[data-item]").dataset.item;
  button.addEventListener("click", () => {
    if (quantities.get(id) === 99) {
      announce("Puedes agregar hasta 99 unidades de cada producto.");
      return;
    }
    updateQuantity(id, 1);
    announce(`${inventory.get(id).name} agregado a tu bolsa.`);
  });
  button.hidden = false;
});

itemList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-difference]");
  if (!button) return;

  const { itemId, difference } = button.dataset;
  updateQuantity(itemId, Number(difference));
  const replacement = itemList.querySelector(`[data-item-id="${itemId}"][data-difference="${difference}"]`);
  (replacement ?? itemList.querySelector("button") ?? bag.querySelector(".close-bag")).focus();
});

bagButton.addEventListener("click", () => bag.showModal());
updateBag();
bagButton.hidden = false;
