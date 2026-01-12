function getMetaContent(property) {
  const element =
    document.querySelector(`meta[property='${property}']`) ||
    document.querySelector(`meta[name='${property}']`);
  return element ? element.getAttribute("content") : null;
}

function scrapeProductData() {
  const url = window.location.href;
  let title = getMetaContent("og:title") || document.title;
  let image = getMetaContent("og:image");
  let price = 0;
  let store = "other";

  // Store Specific Logic (Fallbacks)
  if (url.includes("amazon")) {
    store = "amazon";
    if (!price) {
      const priceEl = document.querySelector(".a-price-whole");
      if (priceEl)
        price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
    }
    if (!title)
      title = document.querySelector("#productTitle")?.innerText.trim();
  } else if (url.includes("flipkart")) {
    store = "flipkart";
    const priceEl = document.querySelector("._30jeq3"); // Class might change, inspect element to confirm
    if (priceEl) price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
  } else if (url.includes("myntra")) {
    store = "myntra";
    // Myntra script data is usually hidden in JSON-LD or difficult to scrape purely via DOM
    // Fallback to meta tags usually works for image/title
  } else if (url.includes("ajio")) {
    store = "ajio";
    const priceEl = document.querySelector(".prod-sp");
    if (priceEl) price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
  }

  return {
    title: title || "Unknown Product",
    image: image || "",
    price: price || 0,
    url: url,
    store: store,
  };
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE") {
    const data = scrapeProductData();
    sendResponse(data);
  }
});
