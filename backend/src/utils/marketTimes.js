// Utility to check if the Indian stock market is open
// Always evaluate market time in IST (Asia/Kolkata)
export function isMarketOpen() {
  const nowUtc = new Date();
  const now = new Date(nowUtc.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const openMinutes = 9 * 60 + 15;  // 9:15 AM
  const closeMinutes = 15 * 60 + 30; // 3:30 PM

  const isOpen = totalMinutes >= openMinutes && totalMinutes <= closeMinutes;
  return isOpen;
}

