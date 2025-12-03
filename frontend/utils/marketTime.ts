export function getMarketStatusIST() {
  const nowUtc = new Date();
  const now = new Date(
    nowUtc.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;

  const marketOpen =
    totalMinutes >= openMinutes && totalMinutes <= closeMinutes;

  return { marketOpen, now };
}

export function getMarketCountdownIST() {
  const nowUtc = new Date();
  const now = new Date(
    nowUtc.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;

  const marketOpen =
    totalMinutes >= openMinutes && totalMinutes <= closeMinutes;

  // calculate difference
  const diffMinutes = marketOpen
    ? closeMinutes - totalMinutes
    : totalMinutes < openMinutes
    ? openMinutes - totalMinutes
    : 24 * 60 - totalMinutes + openMinutes;

  const hoursLeft = Math.floor(diffMinutes / 60);
  const minsLeft = diffMinutes % 60;

  return {
    marketOpen,
    hoursLeft,
    minsLeft,
  };
}
