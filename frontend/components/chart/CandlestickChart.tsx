'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
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

interface RawRSIPoint {
  time: string
  value: number
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
  rsi: number | null
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

const RSI_PERIOD = 14

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
  rsiLine: '#a78bfa', // purple-400, matches TradingView's RSI convention
  rsiBand: 'rgba(167,139,250,0.08)',
  rsiRef: 'rgba(156,163,175,0.25)',
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
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const openCandleRef = useRef<CandlestickData | null>(null)
  const openVolumeRef = useRef<number>(0)
  const rsiDataRef = useRef<LineData[]>([])

  // ref to track known cumulative volume per
  const lastCumulativeVolumeRef = useRef<number>(0)

  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [showRSI, setShowRSI] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [latestRSI, setLatestRSI] = useState<number | null>(null)

  // ── Apply pane layout depending on whether RSI is visible ──────────────────
  // Candles always get the top chunk. Volume is a thin strip.
  // RSI (when on) takes the bottom chunk, otherwise volume reclaims that space.
  const applyPaneLayout = useCallback((rsiVisible: boolean) => {
    if (!chartRef.current || !volumeSeriesRef.current || !rsiSeriesRef.current) return

    if (rsiVisible) {
      // Candles: top 58% | Volume: middle 14% | RSI: bottom 28%
      chartRef.current.priceScale('right').applyOptions({
        scaleMargins: { top: 0.05, bottom: 0.42 },
      })
      volumeSeriesRef.current.priceScale().applyOptions({
        scaleMargins: { top: 0.58, bottom: 0.30 },
      })
      rsiSeriesRef.current.priceScale().applyOptions({
        scaleMargins: { top: 0.74, bottom: 0.02 },
      })
    } else {
      // Candles: top 72% | Volume: bottom 25%
      chartRef.current.priceScale('right').applyOptions({
        scaleMargins: { top: 0.08, bottom: 0.28 },
      })
      volumeSeriesRef.current.priceScale().applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 },
      })
    }
  }, [])

  // ── Fetch candles ────────────────────────────────────────────────────────────
  const loadCandles = useCallback(async (tf: Timeframe) => {
    const interval = TIMEFRAME_TO_INTERVAL[tf]
    const limit = TIMEFRAME_TO_LIMIT[tf]
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/candles/${symbol}?interval=${interval}&limit=${limit}`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, [symbol])

  // ── Fetch RSI ────────────────────────────────────────────────────────────────
  const loadRSI = useCallback(async (tf: Timeframe) => {
    const interval = TIMEFRAME_TO_INTERVAL[tf]
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/candles/${symbol}/rsi?interval=${interval}&period=${RSI_PERIOD}`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, [symbol])

  // ── Load + render everything for the current timeframe ─────────────────────
  const loadAll = useCallback(
    async (tf: Timeframe) => {
      setIsLoading(true)
      setError(null)
      setTooltip(null)

      try {
        const candleData = await loadCandles(tf)
        const candles: RawCandle[] = candleData.candles ?? []

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

        if (candleData.openCandle) {
          const oc = candleData.openCandle
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

        // RSI — fetch in parallel-ish, render only if toggle is on
        try {
          const rsiData = await loadRSI(tf)
          const rsiPoints: RawRSIPoint[] = rsiData.rsi ?? []
          const rsiFormatted: LineData[] = rsiPoints.map((p) => ({
            time: (new Date(p.time).getTime() / 1000) as Time,
            value: p.value,
          }))
          rsiDataRef.current = rsiFormatted
          if (rsiSeriesRef.current) {
            rsiSeriesRef.current.setData(rsiFormatted)
          }
          setLatestRSI(rsiFormatted.length ? rsiFormatted[rsiFormatted.length - 1].value : null)
        } catch (rsiErr) {
          console.error('Failed to load RSI:', rsiErr)
          setLatestRSI(null)
        }

        chartRef.current?.timeScale().fitContent()
      } catch (err) {
        console.error('Failed to load chart data:', err)
        setError('Failed to load chart data')
      } finally {
        setIsLoading(false)
      }
    },
    [loadCandles, loadRSI]
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
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor: CHART_COLORS.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        tickMarkFormatter: (time: number) => {
          return new Date(time * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          })
        },
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(0),
        timeFormatter: (time: number) => {
          console.log('axis timeFormatter raw input:', time, new Date(time * 1000).toISOString())
          return new Date(time * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          })
        },
      },
      handleScroll: true,
      handleScale: true,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.upColor,
      downColor: CHART_COLORS.downColor,
      wickUpColor: CHART_COLORS.wickUp,
      wickDownColor: CHART_COLORS.wickDown,
      borderVisible: false,
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: CHART_COLORS.volumeUp,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    })

    // RSI line — own scale, fixed 0-100 range, hidden until toggled on
    const rsiSeries = chart.addSeries(LineSeries, {
      color: CHART_COLORS.rsiLine,
      lineWidth: 2,
      priceScaleId: 'rsi',
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    rsiSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.74, bottom: 0.02 },
    })
    rsiSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: { minValue: 0, maxValue: 100 },
      }),
    })
    rsiSeries.createPriceLine({
      price: 70,
      color: CHART_COLORS.rsiRef,
      lineWidth: 2, 
      lineStyle: 2,
      // axisLabelVisible: true,
      // title: 'overbought',
    })
    rsiSeries.createPriceLine({
      price: 30,
      color: CHART_COLORS.rsiRef,
      lineWidth: 2,
      lineStyle: 2,
      // axisLabelVisible: true,
      // title: 'oversold',
    })

    chartRef.current = chart
    seriesRef.current = series
    volumeSeriesRef.current = volumeSeries
    rsiSeriesRef.current = rsiSeries

    // ── Crosshair tooltip (OHLCV + RSI) ──
    chart.subscribeCrosshairMove((param) => {

      if (!param.time || !param.seriesData) {
        setTooltip(null)
        return
      }

      const candleData = param.seriesData.get(series) as CandlestickData | undefined
      const volumeData = param.seriesData.get(volumeSeries) as HistogramData | undefined
      const rsiPoint = param.seriesData.get(rsiSeries) as LineData | undefined

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
        rsi: rsiPoint ? (rsiPoint.value as number) : null,
        time: timeStr,
        isUp: candleData.close >= candleData.open,
      })
    })

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
      rsiSeriesRef.current = null
    }
  }, [])

  // ── Load data when timeframe changes ────────────────────────────────────────
  useEffect(() => {
    loadAll(timeframe)
  }, [timeframe, loadAll])

  // ── Toggle RSI pane visibility ───────────────────────────────────────────────
  useEffect(() => {
    if (!rsiSeriesRef.current) return
    rsiSeriesRef.current.applyOptions({ visible: showRSI })
    applyPaneLayout(showRSI)
  }, [showRSI, applyPaneLayout])

  // ── Real-time tick updates (candles + volume only — RSI updates on candle close) ─
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

      // tick.volume is CUMULATIVE daily volume from the backend, not a delta.
      // To get "volume within this candle," track the baseline at candle open
      // and subtract it from the current cumulative value.

      const cumulativeVolume = tick.volume ?? 0

      if (isNewCandle) {
        lastCumulativeVolumeRef.current = cumulativeVolume
        openVolumeRef.current = 0

        openCandleRef.current = {
          time,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
        }
        openVolumeRef.current = tick.volume ?? 0

        // A new candle opened — the previous one closed, so RSI has shifted.
        // Refetch RSI quietly in the background without blocking the tick.
        loadRSI(timeframe)
          .then((rsiData) => {
            const rsiPoints: RawRSIPoint[] = rsiData.rsi ?? []
            const rsiFormatted: LineData[] = rsiPoints.map((p) => ({
              time: (new Date(p.time).getTime() / 1000) as Time,
              value: p.value,
            }))
            rsiDataRef.current = rsiFormatted
            if (rsiSeriesRef.current && rsiFormatted.length) {
              rsiSeriesRef.current.setData(rsiFormatted)
              setLatestRSI(rsiFormatted[rsiFormatted.length - 1].value)
            }
          })
          .catch(() => {
            // non-critical — RSI just stays stale until next successful refresh
          })
      } else {

        openVolumeRef.current = cumulativeVolume - lastCumulativeVolumeRef.current

        openCandleRef.current = {
          ...openCandleRef.current!,
          high: Math.max(openCandleRef.current!.high, tick.price),
          low: Math.min(openCandleRef.current!.low, tick.price),
          close: tick.price,
        }
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
  }, [socket, symbol, timeframe, loadRSI])

  // ─── Render ────────────────────────────────────────────────────────────────
  const rsiLabel =
    latestRSI === null ? null : latestRSI >= 70 ? 'overbought' : latestRSI <= 30 ? 'oversold' : null

  return (
    <div className="flex flex-col h-full">
      {/* Controls row */}
      <div className="flex items-center justify-between md:mb-2 min-h-[28px]">
        <div className="flex items-center gap-1">
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

          <div className="w-px h-4 bg-border mx-1" />

          <button
            onClick={() => setShowRSI((v) => !v)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              showRSI
                ? 'bg-violet-600 text-white'
                : 'text-text-secondary hover:text-text hover:bg-bg-elevated'
            }`}
          >
            RSI
          </button>
        </div>

        {/* OHLCV + RSI tooltip — appears on crosshair hover */}
        {tooltip ? (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-text-secondary hidden md:inline">{tooltip.time}</span>
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
            <span className="hidden sm:inline">
              <span className="text-text-secondary">V </span>
              <span className="text-text">{tooltip.volume.toLocaleString('en-IN')}</span>
            </span>
            {showRSI && tooltip.rsi !== null && (
              <span>
                <span className="text-text-secondary">RSI </span>
                <span className="text-violet-400">{tooltip.rsi.toFixed(2)}</span>
              </span>
            )}
          </div>
        ) : showRSI && latestRSI !== null ? (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-text-secondary">RSI {RSI_PERIOD}</span>
            <span className="text-violet-400">{latestRSI.toFixed(2)}</span>
            {rsiLabel && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  rsiLabel === 'overbought'
                    ? 'bg-negative/15 text-negative'
                    : 'bg-positive/15 text-positive'
                }`}
              >
                {rsiLabel}
              </span>
            )}
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
                onClick={() => loadAll(timeframe)}
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