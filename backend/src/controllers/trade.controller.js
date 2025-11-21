import { prisma } from "../utils/db.js";
import { Prisma } from "@prisma/client";
import { isMarketOpen } from "../utils/marketTimes.js";

// BUY stock
export const buyStock = async (req, res) => {
  try {

    // Block trading outside market hours
    if (!isMarketOpen()) {
      return res.status(403).json({ message: "Market is closed. Try again between 9:15 AM and 3:30 PM."});
    }

    const { symbol, quantity, price } = req.body;
    if (!symbol || !quantity || !price || quantity <= 0 || price <= 0) {
      return res.status(400).json({ message: "Valid symbol, quantity, price required" });
    }
    const userId = req.user.id;
    const totalCost = price * quantity;
    //log for debug
    console.log("Authenticated user:", req.user);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { supabaseId: userId } });
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.balance < totalCost) throw new Error("INSUFFICIENT_FUNDS");

      await tx.user.update({
        where: { supabaseId: userId },
        data: { balance: { decrement: totalCost } }
      });

      const existing = await tx.portfolio.findFirst({ where: { userId, symbol } });

      if (!existing) {
        await tx.portfolio.create({
          data: { userId, symbol, quantity, avgPrice: price }
        });
      } else {
        const newQty = existing.quantity + quantity;
        const newAvgRaw = ((existing.quantity * existing.avgPrice) + (quantity * price)) / newQty;
        const newAvg = Math.round(newAvgRaw * 100) / 100; // keep as number, 2dp

        await tx.portfolio.update({
          where: { id: existing.id },
          data: { quantity: newQty, avgPrice: newAvg }
        });
      }

      await tx.transaction.create({
        data: {
          userId,
          symbol,
          type: "BUY",
          quantity,
          price: new Prisma.Decimal(price),
          total: new Prisma.Decimal(totalCost),
          realizedPnl: new Prisma.Decimal(0)
        }
      });

    });

    return res.status(200).json({ message: "Buy executed" });
  } catch (err) {
    if (err.message === "INSUFFICIENT_FUNDS") {
      return res.status(403).json({ error: "Insufficient Funds", message: "Balance too low to execute order" });
    }
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// SELL stock
export const sellStock = async (req, res) => {
  try {

    // Block trading outside market hours
    if (!isMarketOpen()) {
      return res.status(403).json({ message: "Market is closed. Try again between 9:15 AM and 3:30 PM."});
    }

    const { symbol, quantity } = req.body;
    const userId = req.user.id;
    //log for debug
    console.log("Authenticated user:", req.user);

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Valid symbol and quantity required" });
    }

    // ✅ 1. Get current market price from global stock engine (backend memory)
    const stock = global.STOCKS?.find(
      s => s.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    const price = stock.price;

    // ✅ 2. Find user's current holding
    const holding = await prisma.portfolio.findFirst({
      where: { userId, symbol },
    });

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ message: "Not enough shares to sell" });
    }

    // ✅ 3. Calculate realized profit
    const avgBuyPrice = Number(holding.avgPrice);
    const realizedPnl = (price - avgBuyPrice) * quantity;

    // ✅ 4. Update user's portfolio
    const newQty = holding.quantity - quantity;

    if (newQty > 0) {
      await prisma.portfolio.update({
        where: { id: holding.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.portfolio.delete({ where: { id: holding.id } });
    }

    // ✅ 5. Update user's balance
    const user = await prisma.user.findUnique({ where: { supabaseId: userId } });
    const newBalance = Number(user.balance) + price * quantity;

    await prisma.user.update({
      where: { supabaseId: userId },
      data: { balance: newBalance },
    });

    // ✅ 6. Record transaction with realizedPnL
    await prisma.transaction.create({
      data: {
        userId,
        symbol,
        type: "SELL",
        quantity,
        price,
        total: price * quantity,
        realizedPnl,
      },
    });

    return res.status(200).json({
      message: "Sell successful",
      realizedPnl,
      newBalance,
    });
  } catch (error) {
    console.error("SELL ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SQUARE-OFF stock
export const squaredOffPosition = async (req, res) => {
  try {

    // Block trading outside market hours
    if (!isMarketOpen()) {
      return res.status(403).json({ message: "Market is closed. Try again between 9:15 AM and 3:30 PM."});
    }
    
    const { symbol, price } = req.body;
    if (!symbol || !price || price <= 0) {
      return res.status(400).json({ message: "Valid symbol & price required" });
    }
    const userId = req.user.id;
    //log for debug
    console.log("Authenticated user:", req.user);


    await prisma.$transaction(async (tx) => {
      const holding = await tx.portfolio.findFirst({ where: { userId, symbol } });
      if (!holding || holding.quantity <= 0) throw new Error("NO_POSITION");

      const qty = holding.quantity;
      const total = qty * price;

      await tx.user.update({
        where: { supabaseId: userId },
        data: { balance: { increment: total } }
      });

      await tx.portfolio.delete({ where: { id: holding.id } });

      const avgBuyPrice = holding.avgPrice;
      const realizedPnlRaw = (price - avgBuyPrice) * qty;
      const realizedPnl = Math.round(realizedPnlRaw * 100) / 100;

      await tx.transaction.create({
        data: {
          userId,
          symbol,
          type: "SELL", // or "SQUARE_OFF" if you prefer a distinct type
          quantity: qty,
          price,
          total,
          realizedPnl: realizedPnl.toFixed(2)
        }
      });
    });

    return res.status(200).json({ message: "Square off done" });
  } catch (err) {
    if (err.message === "NO_POSITION") {
      return res.status(409).json({ message: "No position to square off" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// import { quartersInYear } from "date-fns/constants";
// import { prisma } from "../utils/db.js";

// // Weighted average formula
// // new_avg = ( (old_qty * old_avg) + (new_qty * buy_price) ) / (old_qty + new_qty)

// export const buyStock = async (req, res) => {
//   try {
//     const { symbol, quantity, price } = req.body;

//     if (!symbol || !quantity || !price) {
//       return res.status(400).json({ message: "symbol, quantity & price required" });
//     }
//     const userId = req.user.id;   // coming from JWT verified middleware

//     // update balance
//     const user = await prisma.user.findUnique({ where: { supabaseId: userId } })

//     // check if user have sufficient balance to buy stocks
//     const totalCost = price * quantity;
//     if(user.balance < totalCost) {
//       // 1. Log or Handle the error on the server side
//       console.error(`Purchase failed: User ${user.id} balance $${user.balance} is less than cost $${totalCost}`);
//       // 2. Return an error response to the user
//       return res.status(403).json({ 
//           error: "Insufficient Funds", 
//           message: `Your balance of $${user.balance.toFixed(2)} is too low for a $${totalCost.toFixed(2)} purchase.` 
//       });
//     }

//     const newBalance = Number(user.balance) - price

//     await prisma.user.update({
//       where: { supabaseId: userId },
//       data: { balance: newBalance }
//     })

//     // get portfolio row for that symbol
//     const existing = await prisma.portfolio.findFirst({
//       where: { userId, symbol }
//     });

//     if (!existing) {
//       // create new holding
//       await prisma.portfolio.create({
//         data: {
//           userId,
//           symbol,
//           quantity,
//           avgPrice: price
//         }
//       });
//     } else {
//       const newQty = existing.quantity + quantity;
//       const newAvgPrice = Number(((existing.quantity * existing.avgPrice) + (quantity * price)) / newQty).toFixed(2)


//       await prisma.portfolio.update({
//         where: { id: existing.id },
//         data: {
//           quantity: newQty,
//           avgPrice: newAvgPrice
//         }
//       });
//     }

//     // record transaction
//     await prisma.transaction.create({
//       data: {
//         userId,
//         symbol,
//         type: "BUY",
//         quantity,
//         price,
//         total: quantity * price
//       }
//     });

//     res.status(200).json({ message: "Trade executed" });

//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };


// // Sell stock controller

// export const sellStock = async (req, res) => {
//   try {
//     const { symbol, quantity, price } = req.body;

//     if (!symbol || !quantity || !price) {
//       return res.status(400).json({ message: "symbol, quantity & price required" });
//     }

//     const userId = req.user.id;

//     // update portfolio
//     const existing = await prisma.portfolio.findFirst({
//       where: { userId, symbol }
//     });

//     if (!existing) {
//       return res.status(400).json({ message: "No holdings found for this stock" });
//     }

//     if (existing.quantity < quantity) {
//       return res.status(400).json({ message: "Not enough quantity to sell" });
//     }

//     const newQty = existing.quantity - quantity;

//     if (newQty === 0) {
//       await prisma.portfolio.delete({
//         where: { id: existing.id }
//       });
//     } else {
//       await prisma.portfolio.update({
//         where: { id: existing.id },
//         data: { quantity: newQty }
//       });
//     }

//     await prisma.transaction.create({
//       data: {
//         userId,
//         symbol,
//         type: "SELL",
//         quantity,
//         price,
//         total: quantity * price
//       }
//     });

//     res.status(200).json({ message: "Sell executed" });

//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };

// // squaring off all the trades

// export const squaredOffPosition = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { symbol, price } = req.body; // frontend sends current market price

//     const holding = await prisma.portfolio.findFirst({
//       where: { userId, symbol }
//     });

//     if (!holding || holding.quantity <= 0) {
//       return res.status(400).json({ message: "No position to sqaure off"})
//     }

//     // re-use sell logic fully but selling entire qty
//     const qty = holding.quantity;
//     const total = price * qty;

//     // update balance
//     await prisma.user.update({
//       where: { supabaseId: userId },
//       data: { balance: { increment: total } }
//     });

//     // remove holding or set 0 qty
//     await prisma.portfolio.delete({
//       where: {
//         id: holding.id
//       },
//     });

//     await prisma.transaction.create({
//       data: {
//         userId,
//         symbol,
//         quantity: qty,
//         price,
//         total,
//         type: "SELL"
//       }
//     });

//     return res.status(200).json({ message: "Square off done" });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };