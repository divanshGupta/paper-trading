'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts'
import { socket } from '@/lib/socket'

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawCandle {
  tStart: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandlestickChartProps {
  symbol: string
  currentPrice: number
  previousClose: number
}

interface TooltipData {
  open: number
  high: number
  low: number
  close: number
  volume: number
  time: string
  isUp: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEFRAMES = ['1D', '1W', '1M', '3M'] as const
type Timeframe = (typeof TIMEFRAMES)[number]

const TIMEFRAME_TO_INTERVAL: Record<Timeframe, string> = {
  '1D': '1min',
  '1W': '5min',
  '1M': '15min',
  '3M': '1hour',
}

const TIMEFRAME_TO_LIMIT: Record<Timeframe, number> = {
  '1D': 375,
  '1W': 500,
  '1M': 500,
  '3M': 500,
}

const DURATION_MS: Record<string, number> = {
  '1min': 60_000,
  '5min': 300_000,
  '15min': 900_000,
  '1hour': 3_600_000,
  '1day': 86_400_000,
}

const CHART_COLORS = {
  bg: 'transparent',
  grid: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  text: '#9ca3af',
  upColor: '#16a34a',
  downColor: '#dc2626',
  wickUp: '#16a34a',
  wickDown: '#dc2626',
  crosshair: 'rgba(156,163,175,0.4)',
  volumeUp: 'rgba(22,163,74,0.4)',
  volumeDown: 'rgba(220,38,38,0.4)',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CandlestickChart({
  symbol,
  currentPrice,
  previousClose,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const openCandleRef = useRef<CandlestickData | null>(null)
  const openVolumeRef = useRef<number>(0)

  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  // ── Fetch + render candles ──────────────────────────────────────────────────
  const loadCandles = useCallback(
    async (tf: Timeframe) => {
      setIsLoading(true)
      setError(null)
      setTooltip(null)

      try {
        const interval = TIMEFRAME_TO_INTERVAL[tf]
        const limit = TIMEFRAME_TO_LIMIT[tf]
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/candles/${symbol}?interval=${interval}&limit=${limit}`
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const candles: RawCandle[] = data.candles ?? []

        if (!seriesRef.current || !volumeSeriesRef.current) return

        const formatted: CandlestickData[] = candles.map((c) => ({
          time: (new Date(c.tStart).getTime() / 1000) as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))

        const volumeFormatted: HistogramData[] = candles.map((c) => ({
          time: (new Date(c.tStart).getTime() / 1000) as Time,
          value: c.volume,
          color: c.close >= c.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
        }))

        seriesRef.current.setData(formatted)
        volumeSeriesRef.current.setData(volumeFormatted)

        // Seed open candle
        if (data.openCandle) {
          const oc = data.openCandle
          const ocTime = (new Date(oc.tStart).getTime() / 1000) as Time
          openCandleRef.current = {
            time: ocTime,
            open: oc.open,
            high: oc.high,
            low: oc.low,
            close: oc.close,
          }
          openVolumeRef.current = oc.volume ?? 0
          seriesRef.current.update(openCandleRef.current)
          volumeSeriesRef.current.update({
            time: ocTime,
            value: openVolumeRef.current,
            color: oc.close >= oc.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
          })
        }

        chartRef.current?.timeScale().fitContent()
      } catch (err) {
        console.error('Failed to load candles:', err)
        setError('Failed to load chart data')
      } finally {
        setIsLoading(false)
      }
    },
    [symbol]
  )

  // ── Create chart once on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.bg },
        textColor: CHART_COLORS.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: '#1f2937' },
        horzLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: '#1f2937' },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.border,
        // Candles take top 72%, volume sits in bottom 28%
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor: CHART_COLORS.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      localization: {
        timeFormatter: (time: number) =>
          new Date(time * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          }),
      },
      handleScroll: true,
      handleScale: true,
    })

    // Candlestick series
    const series = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.upColor,
      downColor: CHART_COLORS.downColor,
      wickUpColor: CHART_COLORS.wickUp,
      wickDownColor: CHART_COLORS.wickDown,
      borderVisible: false,
    })

    // Volume histogram on a separate price scale
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: CHART_COLORS.volumeUp,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    // Pin volume to the bottom 25% so it never overlaps candles
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    })

    chartRef.current = chart
    seriesRef.current = series
    volumeSeriesRef.current = volumeSeries

    // ── OHLCV crosshair tooltip ──
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setTooltip(null)
        return
      }

      const candleData = param.seriesData.get(series) as CandlestickData | undefined
      const volumeData = param.seriesData.get(volumeSeries) as HistogramData | undefined

      if (!candleData) {
        setTooltip(null)
        return
      }

      const timeStr = new Date((param.time as number) * 1000).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      })

      setTooltip({
        open: candleData.open,
        high: candleData.high,
        low: candleData.low,
        close: candleData.close,
        volume: (volumeData?.value as number) ?? 0,
        time: timeStr,
        isUp: candleData.close >= candleData.open,
      })
    })

    // Responsive resize
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [])

  // ── Load candles when timeframe changes ────────────────────────────────────
  useEffect(() => {
    loadCandles(timeframe)
  }, [timeframe, loadCandles])

  // ── Real-time tick updates ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleTicks = (ticks: { symbol: string; price: number; volume?: number }[]) => {
      const tick = ticks.find((t) => t.symbol === symbol)
      if (!tick || !seriesRef.current || !volumeSeriesRef.current) return

      const interval = TIMEFRAME_TO_INTERVAL[timeframe]
      const durationMs = DURATION_MS[interval] ?? 60_000

      const now = Date.now()
      const tStart = Math.floor(now / durationMs) * durationMs
      const time = (tStart / 1000) as Time

      const isNewCandle = !openCandleRef.current || openCandleRef.current.time !== time

      if (isNewCandle) {
        openCandleRef.current = {
          time,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
        }
        openVolumeRef.current = tick.volume ?? 0
      } else {
        openCandleRef.current = {
          ...openCandleRef.current!,
          high: Math.max(openCandleRef.current!.high, tick.price),
          low: Math.min(openCandleRef.current!.low, tick.price),
          close: tick.price,
        }
        openVolumeRef.current += tick.volume ?? 0
      }

      const isUp = openCandleRef.current.close >= openCandleRef.current.open

      seriesRef.current.update(openCandleRef.current)
      volumeSeriesRef.current.update({
        time,
        value: openVolumeRef.current,
        color: isUp ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
      })
    }

    socket.on('price:ticks', handleTicks)
    return () => {
      socket.off('price:ticks', handleTicks)
    }
  }, [socket, symbol, timeframe])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Timeframe selector + OHLCV tooltip row */}
      <div className="flex items-center justify-between mb-3 min-h-[28px]">
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-text-secondary hover:text-text hover:bg-bg-elevated'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* OHLCV values — appear on crosshair hover */}
        {tooltip ? (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-text-secondary hidden sm:inline">{tooltip.time}</span>
            <span>
              <span className="text-text-secondary">O </span>
              <span className={tooltip.isUp ? 'text-positive' : 'text-negative'}>
                ₹{tooltip.open.toFixed(2)}
              </span>
            </span>
            <span>
              <span className="text-text-secondary">H </span>
              <span className="text-positive">₹{tooltip.high.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-text-secondary">L </span>
              <span className="text-negative">₹{tooltip.low.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-text-secondary">C </span>
              <span className={tooltip.isUp ? 'text-positive' : 'text-negative'}>
                ₹{tooltip.close.toFixed(2)}
              </span>
            </span>
            <span>
              <span className="text-text-secondary">V </span>
              <span className="text-text">{tooltip.volume.toLocaleString('en-IN')}</span>
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-secondary/40 hidden sm:inline">
            Hover candle for details
          </span>
        )}
      </div>

      {/* Chart container */}
      <div className="relative flex-1">
        <div ref={containerRef} className="w-full h-full" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/60 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-text-secondary">Loading chart…</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-negative">{error}</p>
              <button
                onClick={() => loadCandles(timeframe)}
                className="mt-2 text-xs text-blue-400 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}