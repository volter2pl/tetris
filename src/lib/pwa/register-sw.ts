let hasRegistered = false;

export const registerServiceWorker = () => {
  if (hasRegistered || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  hasRegistered = true;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error) => console.error("SW registration failed", error));
  });
};
