import { supabase } from "./supabase-client.js";

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log("Wishlist Tracker installed");
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    // Clear any cached data
    chrome.storage.local.clear();
  }
});

// Optional: Set up alarms for periodic checks
chrome.alarms.create("syncWishlists", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncWishlists") {
    // Trigger sync or background task
    syncUserWishlists();
  }
});

async function syncUserWishlists() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  // Add logic to sync wishlists or check for updates
}
