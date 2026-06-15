-- CreateTable
CREATE TABLE "Candle" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "open" DECIMAL(10,2) NOT NULL,
    "high" DECIMAL(10,2) NOT NULL,
    "low" DECIMAL(10,2) NOT NULL,
    "close" DECIMAL(10,2) NOT NULL,
    "volume" INTEGER NOT NULL,
    "tStart" TIMESTAMP(3) NOT NULL,
    "tEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Candle_symbol_interval_tStart_idx" ON "Candle"("symbol", "interval", "tStart");

-- CreateIndex
CREATE UNIQUE INDEX "Candle_symbol_interval_tStart_key" ON "Candle"("symbol", "interval", "tStart");
