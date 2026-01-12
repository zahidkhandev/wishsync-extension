import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://myxvrzfzxxkpbnfantod.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eHZyemZ6eHhrcGJuZmFudG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2NzU2OTAsImV4cCI6MjA1MjI1MTY5MH0.0gy-VXkI3L7K6y_gXQo5bnGvGfJZqV-LcDNqWLx30Hk";

// Rest of your code (don't change anything below)
const chromeStorageAdapter = {
  getItem: (key) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[key] || null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  setItem: (key, value) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  removeItem: (key) => {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
