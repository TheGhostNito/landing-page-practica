const items = new Map(
  [...document.querySelectorAll("[data-item]")].map((entry) => [
    entry.dataset.item,
    {
      name: entry.querySelector("[data-name]").textContent,
      price: Number(entry.dataset.price),
    },
  ]),
);

const storageKey = "bocado-bolsa-v1";
const quantityLimit = 99;
const formatPrice = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
});

const dialog = document.querySelector("#bolsa");
const openBag = document.querySelector("#open-bag");
const closeBag = document.querySelector("#close-bag");
const bagCount = openBag.querySelector(".bag-count");
const bagItems = dialog.querySelector(".bag-items");
const bagEmpty = dialog.querySelector(".bag-empty");
const bagTotal = dialog.querySelector(".bag-total");
const bagTotalPrice = bagTotal.querySelector("strong");
const template = document.querySelector("#bag-item-template");
const notification = document.querySelector(".notification");
let notificationTimer;
let bag = loadBag();

function loadBag() {
  const selection = new Map();

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    for (const id of items.keys()) {
      const quantity = stored?.[id];
      if (Number.isInteger(quantity) && quantity > 0 && quantity <= quantityLimit) {
        selection.set(id, quantity);
      }
    }
  } catch {
    // If storage is unavailable, keep the selection in memory for this visit.
  }

  return selection;
}

function storeBag() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(bag)));
  } catch {
    // The page still works for the current visit without local storage.
  }
}

function notify(message) {
  clearTimeout(notificationTimer);
  notification.textContent = message;
  notification.classList.add("is-visible");
  notificationTimer = setTimeout(() => {
    notification.classList.remove("is-visible");
    notification.textContent = "";
  }, 2500);
}

function renderBag() {
  const activeControl = bagItems.contains(document.activeElement) ? document.activeElement : null;
  const activeLine = activeControl?.closest(".bag-item");
  const nearbyLine = activeLine?.nextElementSibling ?? activeLine?.previousElementSibling;
  const lines = document.createDocumentFragment();
  let count = 0;
  let total = 0;

  for (const [id, quantity] of bag) {
    const item = items.get(id);
    const line = template.content.cloneNode(true);
    const [decrease, increase] = line.querySelectorAll("[data-change]");
    line.querySelector(".bag-item-name").textContent = item.name;
    line.querySelector(".bag-item-price").textContent = formatPrice.format(item.price);
    line.querySelector(".bag-item-quantity").textContent = quantity;
    line.querySelector(".bag-item").dataset.id = id;
    decrease.setAttribute("aria-label", `Quitar una unidad de ${item.name}`);
    increase.setAttribute("aria-label", `Añadir una unidad de ${item.name}`);
    increase.disabled = quantity === quantityLimit;
    lines.append(line);
    count += quantity;
    total += item.price * quantity;
  }

  bagItems.replaceChildren(lines);
  bagCount.textContent = count;
  openBag.setAttribute("aria-label", `Mi bolsa, ${count} ${count === 1 ? "producto" : "productos"}`);
  bagEmpty.hidden = count > 0;
  bagTotal.hidden = count === 0;
  bagTotalPrice.textContent = formatPrice.format(total);

  if (activeLine) {
    const updatedLines = [...bagItems.children];
    const updatedLine = updatedLines.find((line) => line.dataset.id === activeLine.dataset.id);
    const nearbyUpdatedLine = updatedLines.find((line) => line.dataset.id === nearbyLine?.dataset.id);
    const sameControl = updatedLine?.querySelector(`[data-change="${activeControl.dataset.change}"]:enabled`);
    const focusTarget = sameControl ?? (updatedLine ?? nearbyUpdatedLine)?.querySelector("button") ?? closeBag;
    focusTarget.focus({ preventScroll: true });
  }
}

function changeQuantity(id, difference) {
  const quantity = (bag.get(id) ?? 0) + difference;
  if (quantity > quantityLimit) return false;

  if (quantity > 0) {
    bag.set(id, quantity);
  } else {
    bag.delete(id);
  }

  storeBag();
  renderBag();
  return true;
}

for (const button of document.querySelectorAll("[data-add]")) {
  button.hidden = false;
  button.addEventListener("click", () => {
    const id = button.dataset.add;
    if (!changeQuantity(id, 1)) {
      notify(`El máximo por producto es de ${quantityLimit} unidades.`);
      return;
    }

    notify(`${items.get(id).name} · Añadido a tu bolsa`);
    button.classList.add("is-added");
    setTimeout(() => button.classList.remove("is-added"), 420);
  });
}

renderBag();
openBag.hidden = false;
openBag.addEventListener("click", () => dialog.showModal());
closeBag.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

dialog.querySelector(".bag-return").addEventListener("click", () => dialog.close());

bagItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-change]");
  if (!button) return;

  changeQuantity(button.closest(".bag-item").dataset.id, Number(button.dataset.change));
});

window.addEventListener("storage", (event) => {
  if ((event.key === storageKey || event.key === null) && event.storageArea === localStorage) {
    bag = loadBag();
    renderBag();
  }
});

const filters = document.querySelector(".filters");
const products = [...document.querySelectorAll(".product")];
filters.hidden = false;

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  for (const filter of filters.querySelectorAll("[data-filter]")) {
    filter.setAttribute("aria-pressed", String(filter === button));
  }

  const category = button.dataset.filter;
  for (const product of products) {
    product.hidden = category !== "all" && product.dataset.category !== category;
  }

  const count = products.filter((product) => !product.hidden).length;
  const resultCount = document.querySelector("#filter-results");
  resultCount.textContent = `${count} ${count === 1 ? "dulce" : "dulces"} en el catálogo.`;
});

const header = document.querySelector(".site-header");
const nav = header.querySelector(".main-nav");
const menuToggle = header.querySelector(".menu-toggle");
const mobileMenu = window.matchMedia("(max-width: 800px)");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menuToggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
}

function syncMenu() {
  menuToggle.hidden = !mobileMenu.matches;
  setMenu(false);
}

header.classList.add("has-menu");
syncMenu();
mobileMenu.addEventListener("change", syncMenu);

menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") === "false"));

nav.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (link && mobileMenu.matches) {
    setMenu(false);
    document.querySelector(link.hash)?.focus({ preventScroll: true });
  }
});

document.addEventListener("click", (event) => {
  if (!header.contains(event.target) && nav.classList.contains("is-open")) setMenu(false);
});

header.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    menuToggle.focus();
  }
});
