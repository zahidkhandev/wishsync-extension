import { supabase } from "./supabase-client.js";

// DOM Elements
const views = {
  loading: document.getElementById("loading"),
  auth: document.getElementById("auth-view"),
  main: document.getElementById("main-view"),
};

let currentProduct = null;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    initMainView(session.user);
  } else {
    switchView("auth");
  }
});

function switchView(viewName) {
  Object.values(views).forEach((el) => el.classList.add("hidden"));
  views[viewName].classList.remove("hidden");
}

// --- Auth Logic ---
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("auth-error");

  errorEl.innerText = "";
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorEl.innerText = error.message;
  } else {
    initMainView(data.user);
  }
});

document.getElementById("btn-signup").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("auth-error");

  errorEl.innerText = "";
  // Optional: Add metadata like full_name here if your SQL requires it immediately
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: email.split("@")[0] } }, // Fallback name
  });

  if (error) {
    errorEl.innerText = error.message;
  } else {
    alert("Check your email for the confirmation link!");
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  switchView("auth");
});

// --- Main View Logic ---
async function initMainView(user) {
  switchView("loading");

  // 1. Load Wishlists
  await loadWishlists(user.id);

  // 2. Scrape Page
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url.startsWith("http")) {
      throw new Error("Not a valid product page");
    }

    // Inject script if not already there (Manifest V3 approach)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // Request data
    chrome.tabs.sendMessage(tab.id, { action: "SCRAPE" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        console.error(chrome.runtime.lastError);
        renderProduct({
          title: "Could not detect product",
          price: 0,
          image: "",
        });
        return;
      }

      // Validate response structure
      if (!response.url || !response.title) {
        console.error("Invalid product data received");
        return;
      }

      currentProduct = response;
      renderProduct(response);
    });

    switchView("main");
  } catch (err) {
    console.error(err);
    document.getElementById("p-title").innerText =
      "Please navigate to a product page (Amazon, Flipkart, etc)";
    switchView("main");
  }
}

async function loadWishlists(userId) {
  const select = document.getElementById("wishlist-select");
  select.innerHTML = "<option disabled>Loading...</option>";

  const { data: wishlists, error } = await supabase
    .from("wishlists")
    .select("id, title")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  select.innerHTML = "";

  if (wishlists && wishlists.length > 0) {
    wishlists.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w.id;
      opt.innerText = w.title;
      select.appendChild(opt);
    });
  } else {
    const opt = document.createElement("option");
    opt.innerText = "No wishlists found";
    select.appendChild(opt);
  }
}

function renderProduct(data) {
  document.getElementById("p-title").innerText = data.title;
  document.getElementById("p-price").innerText = data.price
    ? `₹${data.price}`
    : "Price not found";
  if (data.image) document.getElementById("p-image").src = data.image;
}

// --- Action: Add to Wishlist ---
document.getElementById("btn-add").addEventListener("click", async () => {
  const wishlistId = document.getElementById("wishlist-select").value;
  const msgSuccess = document.getElementById("msg-success");
  const msgError = document.getElementById("msg-error");
  const btn = document.getElementById("btn-add");

  if (!currentProduct || !wishlistId) return;

  btn.innerText = "Saving...";
  btn.disabled = true;
  msgSuccess.classList.add("hidden");
  msgError.classList.add("hidden");

  // Call your SQL RPC
  const { data, error } = await supabase.rpc("add_to_wishlist", {
    p_wishlist_id: wishlistId,
    p_product_url: currentProduct.url,
    p_title: currentProduct.title,
    p_image_url: currentProduct.image,
    p_store_name: currentProduct.store,
  });

  btn.innerText = "Add to Wishlist";
  btn.disabled = false;

  if (error) {
    msgError.innerText = error.message;
    msgError.classList.remove("hidden");
  } else {
    msgSuccess.classList.remove("hidden");
    setTimeout(() => window.close(), 1500); // Close popup after success
  }
});

// --- Action: Create New Wishlist ---
document
  .getElementById("btn-create-new-toggle")
  .addEventListener("click", () => {
    document.getElementById("new-wishlist-form").classList.toggle("hidden");
  });

document
  .getElementById("btn-create-wishlist")
  .addEventListener("click", async () => {
    const title = document.getElementById("new-wishlist-name").value;
    if (!title) return;

    const { data, error } = await supabase.rpc("create_wishlist", {
      p_title: title,
      p_is_public: false,
      p_use_own_affiliate: false,
    });

    if (error) {
      alert(error.message);
    } else {
      document.getElementById("new-wishlist-name").value = "";
      document.getElementById("new-wishlist-form").classList.add("hidden");
      // Reload list
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await loadWishlists(user.id);
    }
  });
