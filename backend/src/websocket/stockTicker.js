export const registerStockHandlers = (io, socket) => {
  const stocks = ['AAPL', 'TSLA', 'GOOG', 'INFY.NS'];

  const interval = setInterval(() => {
    const stock = stocks[Math.floor(Math.random() * stocks.length)];
    const price = (Math.random() * 1000).toFixed(2);

    io.emit('stock:update', {
      symbol: stock,
      price,
      time: new Date().toLocaleTimeString(),
    });

    console.log(`📤 Emitting: ${stock} - ₹${price}`);
  }, 2000);

  socket.on('disconnect', () => clearInterval(interval));
};
