"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

declare global {
  interface Window {
    d3?: any
    topojson?: any
  }
}

type Province = {
  code: string
  zone: string
  branch: string
  name: string
}

const PROVINCES: Province[] = [
  { code: "BA", zone: "HS BARI ZONE 1", branch: "LMIT-HS-BARI", name: "Bari" },
  { code: "MT", zone: "HS BARI ZONE 1", branch: "LMIT-HS-BARI", name: "Matera" },
  { code: "BT", zone: "HS BARI ZONE 2", branch: "LMIT-HS-BARI", name: "Barletta-Andria-Trani" },
  { code: "FG", zone: "HS BARI ZONE 2", branch: "LMIT-HS-BARI", name: "Foggia" },
  { code: "BR", zone: "HS BARI ZONE 3", branch: "LMIT-HS-BARI", name: "Brindisi" },
  { code: "LE", zone: "HS BARI ZONE 3", branch: "LMIT-HS-BARI", name: "Lecce" },
  { code: "TA", zone: "HS BARI ZONE 3", branch: "LMIT-HS-BARI", name: "Taranto" },
  { code: "FE", zone: "HS BOLOGNA ZONE 1", branch: "LMIT-HS-BOLOGNA", name: "Ferrara" },
  { code: "FC", zone: "HS BOLOGNA ZONE 1", branch: "LMIT-HS-BOLOGNA", name: "Forlì-Cesena" },
  { code: "RA", zone: "HS BOLOGNA ZONE 1", branch: "LMIT-HS-BOLOGNA", name: "Ravenna" },
  { code: "RE", zone: "HS BOLOGNA ZONE 1", branch: "LMIT-HS-BOLOGNA", name: "Reggio Emilia" },
  { code: "BO", zone: "HS BOLOGNA ZONE 1", branch: "LMIT-HS-BOLOGNA", name: "Bologna" },
  { code: "MO", zone: "HS BOLOGNA ZONE 1", branch: "LMIT-HS-BOLOGNA", name: "Modena" },
  { code: "RN", zone: "HS BOLOGNA ZONE 2", branch: "LMIT-HS-BOLOGNA", name: "Rimini" },
  { code: "AN", zone: "HS BOLOGNA ZONE 2", branch: "LMIT-HS-BOLOGNA", name: "Ancona" },
  { code: "FM", zone: "HS BOLOGNA ZONE 2", branch: "LMIT-HS-BOLOGNA", name: "Fermo" },
  { code: "MC", zone: "HS BOLOGNA ZONE 2", branch: "LMIT-HS-BOLOGNA", name: "Macerata" },
  { code: "PU", zone: "HS BOLOGNA ZONE 2", branch: "LMIT-HS-BOLOGNA", name: "Pesaro and Urbino" },
  { code: "FI", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Florence" },
  { code: "LI", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Livorno" },
  { code: "LU", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Lucca" },
  { code: "MS", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Massa-Carrara" },
  { code: "PI", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Pisa" },
  { code: "PT", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Pistoia" },
  { code: "PO", zone: "HS BOLOGNA ZONE 3", branch: "LMIT-HS-BOLOGNA", name: "Prato" },
  { code: "MI", zone: "HS MILANO ZONE 1", branch: "LMIT-HS-MILAN", name: "Milan" },
  { code: "CO", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Como" },
  { code: "LC", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Lecco" },
  { code: "MB", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Monza-Brianza" },
  { code: "VA", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Varese" },
  { code: "SO", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Sondrio" },
  { code: "AL", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Alessandria" },
  { code: "NO", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Novara" },
  { code: "VC", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Vercelli" },
  { code: "VB", zone: "HS MILANO ZONE 2", branch: "LMIT-HS-MILAN", name: "Verbano-Cusio-Ossola" },
  { code: "BG", zone: "HS MILANO ZONE 3", branch: "LMIT-HS-MILAN", name: "Bergamo" },
  { code: "BS", zone: "HS MILANO ZONE 3", branch: "LMIT-HS-MILAN", name: "Brescia" },
  { code: "PR", zone: "HS MILANO ZONE 4", branch: "LMIT-HS-MILAN", name: "Parma" },
  { code: "PC", zone: "HS MILANO ZONE 4", branch: "LMIT-HS-MILAN", name: "Piacenza" },
  { code: "CR", zone: "HS MILANO ZONE 4", branch: "LMIT-HS-MILAN", name: "Cremona" },
  { code: "LO", zone: "HS MILANO ZONE 4", branch: "LMIT-HS-MILAN", name: "Lodi" },
  { code: "MN", zone: "HS MILANO ZONE 4", branch: "LMIT-HS-MILAN", name: "Mantua" },
  { code: "PV", zone: "HS MILANO ZONE 4", branch: "LMIT-HS-MILAN", name: "Pavia" },
  { code: "NA", zone: "HS NAPOLI ZONE 1", branch: "LMIT-HS-NAPLES", name: "Naples" },
  { code: "CE", zone: "HS NAPOLI ZONE 2", branch: "LMIT-HS-NAPLES", name: "Caserta" },
  { code: "SA", zone: "HS NAPOLI ZONE 3", branch: "LMIT-HS-NAPLES", name: "Salerno" },
  { code: "AV", zone: "HS NAPOLI ZONE 4", branch: "LMIT-HS-NAPLES", name: "Avellino" },
  { code: "BN", zone: "HS NAPOLI ZONE 4", branch: "LMIT-HS-NAPLES", name: "Benevento" },
  { code: "PZ", zone: "HS NAPOLI ZONE 5", branch: "LMIT-HS-NAPLES", name: "Potenza" },
  { code: "CZ", zone: "HS NAPOLI ZONE 6", branch: "LMIT-HS-NAPLES", name: "Catanzaro" },
  { code: "CS", zone: "HS NAPOLI ZONE 6", branch: "LMIT-HS-NAPLES", name: "Cosenza" },
  { code: "KR", zone: "HS NAPOLI ZONE 6", branch: "LMIT-HS-NAPLES", name: "Crotone" },
  { code: "RC", zone: "HS NAPOLI ZONE 7", branch: "LMIT-HS-NAPLES", name: "Reggio Calabria" },
  { code: "VV", zone: "HS NAPOLI ZONE 7", branch: "LMIT-HS-NAPLES", name: "Vibo Valentia" },
  { code: "GO", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Gorizia" },
  { code: "PN", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Pordenone" },
  { code: "TS", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Trieste" },
  { code: "UD", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Udine" },
  { code: "PD", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Padua" },
  { code: "RO", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Rovigo" },
  { code: "TV", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Treviso" },
  { code: "VE", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Venice" },
  { code: "VI", zone: "HS PADOVA ZONE 1", branch: "LMIT-HS-PADOVA", name: "Vicenza" },
  { code: "BZ", zone: "HS PADOVA ZONE 2", branch: "LMIT-HS-PADOVA", name: "South Tyrol" },
  { code: "TN", zone: "HS PADOVA ZONE 2", branch: "LMIT-HS-PADOVA", name: "Trento" },
  { code: "BL", zone: "HS PADOVA ZONE 2", branch: "LMIT-HS-PADOVA", name: "Belluno" },
  { code: "VR", zone: "HS PADOVA ZONE 2", branch: "LMIT-HS-PADOVA", name: "Verona" },
  { code: "PA", zone: "HS PALERMO ZONE 1", branch: "LMIT-HS-PALERMO", name: "Palermo" },
  { code: "TP", zone: "HS PALERMO ZONE 1", branch: "LMIT-HS-PALERMO", name: "Trapani" },
  { code: "AG", zone: "HS PALERMO ZONE 2", branch: "LMIT-HS-PALERMO", name: "Agrigento" },
  { code: "CL", zone: "HS PALERMO ZONE 2", branch: "LMIT-HS-PALERMO", name: "Caltanissetta" },
  { code: "CT", zone: "HS PALERMO ZONE 3", branch: "LMIT-HS-PALERMO", name: "Catania" },
  { code: "EN", zone: "HS PALERMO ZONE 3", branch: "LMIT-HS-PALERMO", name: "Enna" },
  { code: "ME", zone: "HS PALERMO ZONE 3", branch: "LMIT-HS-PALERMO", name: "Messina" },
  { code: "RG", zone: "HS PALERMO ZONE 3", branch: "LMIT-HS-PALERMO", name: "Ragusa" },
  { code: "SR", zone: "HS PALERMO ZONE 3", branch: "LMIT-HS-PALERMO", name: "Syracuse" },
  { code: "RM", zone: "HS ROMA ZONE 1", branch: "LMIT-HS-ROME", name: "Rome" },
  { code: "CA", zone: "HS ROMA ZONE 2", branch: "LMIT-HS-ROME", name: "Cagliari" },
  { code: "NU", zone: "HS ROMA ZONE 2", branch: "LMIT-HS-ROME", name: "Nuoro" },
  { code: "OR", zone: "HS ROMA ZONE 2", branch: "LMIT-HS-ROME", name: "Oristano" },
  { code: "SS", zone: "HS ROMA ZONE 2", branch: "LMIT-HS-ROME", name: "Sassari" },
  { code: "SU", zone: "HS ROMA ZONE 2", branch: "LMIT-HS-ROME", name: "Sud Sardegna" },
  { code: "RI", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Rieti" },
  { code: "VT", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Viterbo" },
  { code: "SI", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Siena" },
  { code: "AR", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Arezzo" },
  { code: "GR", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Grosseto" },
  { code: "PG", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Perugia" },
  { code: "TR", zone: "HS ROMA ZONE 3", branch: "LMIT-HS-ROME", name: "Terni" },
  { code: "FR", zone: "HS ROMA ZONE 4", branch: "LMIT-HS-ROME", name: "Frosinone" },
  { code: "LT", zone: "HS ROMA ZONE 4", branch: "LMIT-HS-ROME", name: "Latina" },
  { code: "CH", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "Chieti" },
  { code: "AQ", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "L'Aquila" },
  { code: "PE", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "Pescara" },
  { code: "TE", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "Teramo" },
  { code: "AP", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "Ascoli Piceno" },
  { code: "CB", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "Campobasso" },
  { code: "IS", zone: "HS ROMA ZONE 5", branch: "LMIT-HS-ROME", name: "Isernia" },
  { code: "TO", zone: "HS TORINO ZONE 1", branch: "LMIT-HS-TORINO", name: "Turin" },
  { code: "AO", zone: "HS TORINO ZONE 2", branch: "LMIT-HS-TORINO", name: "Aosta" },
  { code: "AT", zone: "HS TORINO ZONE 2", branch: "LMIT-HS-TORINO", name: "Asti" },
  { code: "BI", zone: "HS TORINO ZONE 2", branch: "LMIT-HS-TORINO", name: "Biella" },
  { code: "CN", zone: "HS TORINO ZONE 2", branch: "LMIT-HS-TORINO", name: "Cuneo" },
  { code: "SV", zone: "HS TORINO ZONE 3", branch: "LMIT-HS-TORINO", name: "Savona" },
  { code: "GE", zone: "HS TORINO ZONE 3", branch: "LMIT-HS-TORINO", name: "Genoa" },
  { code: "IM", zone: "HS TORINO ZONE 3", branch: "LMIT-HS-TORINO", name: "Imperia" },
  { code: "SP", zone: "HS TORINO ZONE 3", branch: "LMIT-HS-TORINO", name: "La Spezia" },
]

const BRANCH_PALETTE: Record<string, { base: string; shades: string[] }> = {
  "LMIT-HS-BARI": { base: "#006AE0", shades: ["#cce0fb", "#99c1f7", "#66a3f3", "#3384ee", "#006AE0", "#0054b3", "#003f87"] },
  "LMIT-HS-BOLOGNA": { base: "#08DC7D", shades: ["#cef9e7", "#9ef3d0", "#6dedb9", "#3de6a2", "#08DC7D", "#06b064", "#04844b"] },
  "LMIT-HS-MILAN": { base: "#FFD54F", shades: ["#fff8dc", "#fff0b3", "#ffe98a", "#ffe161", "#FFD54F", "#ccaa3f", "#997f2f"] },
  "LMIT-HS-NAPLES": { base: "#F04438", shades: ["#fde8e7", "#fbc4c1", "#f9a09b", "#f77b75", "#F04438", "#c0362d", "#902921"] },
  "LMIT-HS-PADOVA": { base: "#7C3AED", shades: ["#ede9fb", "#cfc0f6", "#b197f1", "#936eec", "#7C3AED", "#6230bc", "#49248d"] },
  "LMIT-HS-PALERMO": { base: "#F97316", shades: ["#feeadb", "#fcd0b0", "#fbb685", "#f99c5a", "#F97316", "#c75c12", "#95450d"] },
  "LMIT-HS-ROME": { base: "#21264E", shades: ["#d4d5df", "#a8abbe", "#7d809e", "#51567d", "#21264E", "#1a1e3e", "#13172f"] },
  "LMIT-HS-TORINO": { base: "#0EA5E9", shades: ["#d0edfa", "#a1daf6", "#72c8f2", "#43b5ee", "#0EA5E9", "#0b84ba", "#08638c"] },
}

const BRANCH_LABEL: Record<string, string> = {
  "LMIT-HS-BARI": "Bari",
  "LMIT-HS-BOLOGNA": "Bologna",
  "LMIT-HS-MILAN": "Milan",
  "LMIT-HS-NAPLES": "Naples",
  "LMIT-HS-PADOVA": "Padova",
  "LMIT-HS-PALERMO": "Palermo",
  "LMIT-HS-ROME": "Rome",
  "LMIT-HS-TORINO": "Torino",
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (src.includes("d3") && window.d3) {
      resolve()
      return
    }
    if (src.includes("topojson") && window.topojson) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true })
      if ((existing as any).dataset.loaded === "true") resolve()
      return
    }

    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      ;(script as any).dataset.loaded = "true"
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function shortZone(zone: string) {
  return zone.replace(/^HS /, "").replace(/ ZONE /, " Z")
}

export function BranchCoverageMap() {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const pathSelectionRef = useRef<any>(null)
  const topoRef = useRef<any>(null)
  const activeBranchRef = useRef<string | null>(null)

  const [activeBranch, setActiveBranch] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  activeBranchRef.current = activeBranch

  const byCode = useMemo(() => {
    const m: Record<string, Province> = {}
    for (const p of PROVINCES) m[p.code] = p
    return m
  }, [])

  const branches = useMemo(() => [...new Set(PROVINCES.map((p) => p.branch))].sort(), [])

  const branchZones = useMemo(() => {
    const m: Record<string, string[]> = {}
    for (const b of branches) {
      m[b] = [...new Set(PROVINCES.filter((p) => p.branch === b).map((p) => p.zone))].sort()
    }
    return m
  }, [branches])

  const zonesCount = useMemo(() => [...new Set(PROVINCES.map((p) => p.zone))].length, [])

  const stats = useMemo(() => {
    const provincesCount = activeBranch ? PROVINCES.filter((p) => p.branch === activeBranch).length : PROVINCES.length
    const zones = activeBranch ? branchZones[activeBranch]?.length ?? 0 : zonesCount
    const branchesCount = activeBranch ? 1 : branches.length
    return { provincesCount, zones, branchesCount }
  }, [activeBranch, branchZones, branches.length, zonesCount])

  function getZoneShade(branch: string, zone: string) {
    const pal = BRANCH_PALETTE[branch]
    if (!pal) return "#9ca3af"
    const zonesForBranch = branchZones[branch] ?? []
    const idx = zonesForBranch.indexOf(zone)
    return pal.shades[Math.min(idx + 1, pal.shades.length - 1)]
  }

  function getColor(code: string) {
    const p = byCode[code]
    if (!p) return "#e5e7eb"
    if (activeBranchRef.current && p.branch !== activeBranchRef.current) return "#e5e7eb"
    return getZoneShade(p.branch, p.zone)
  }

  function getStroke(code: string) {
    const p = byCode[code]
    if (!p) return "#d1d5db"
    if (activeBranchRef.current && p.branch !== activeBranchRef.current) return "#d1d5db"
    return "#ffffff"
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js")
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js")
        const res = await fetch("https://cdn.jsdelivr.net/gh/openpolis/geojson-italy@master/topojson/limits_IT_provinces.topo.json")
        if (!res.ok) throw new Error("Failed to load map topology")
        topoRef.current = await res.json()
        if (!cancelled) setReady(true)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load map")
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return

    const host = mapHostRef.current
    const d3 = window.d3
    const topojson = window.topojson
    if (!host || !d3 || !topojson || !topoRef.current) return

    let rafId = 0

    const draw = () => {
      const topo = topoRef.current
      const features = topojson.feature(topo, topo.objects.provinces).features

      const width = host.clientWidth || 500
      const height = Math.round(width * 1.35)

      while (host.firstChild) host.removeChild(host.firstChild)

      const svg = d3
        .select(host)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .style("display", "block")

      const projection = d3.geoMercator().fitSize([width, height], topojson.feature(topo, topo.objects.provinces))
      const path = d3.geoPath(projection)

      const tooltipEl = tooltipRef.current
      const mapRectHost = host.parentElement

      const sel = svg
        .selectAll("path")
        .data(features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any) => getColor(d.properties.prov_acr))
        .attr("stroke", (d: any) => getStroke(d.properties.prov_acr))
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .style("transition", "opacity 0.15s")
        .on("mouseover", function (event: any, d: any) {
          const code = d.properties.prov_acr as string
          const p = byCode[code]
          d3.select(this).attr("stroke-width", 1.5).attr("opacity", 0.85)
          if (p && tooltipEl) {
            tooltipEl.innerHTML = `
              <div style="font-weight:600; font-size:13px; color:#0f172a; margin-bottom:2px;">${p.name} (${code})</div>
              <div style="font-size:11px; color:#475569;">${p.zone}</div>
              <div style="font-size:11px; color:#475569;">${BRANCH_LABEL[p.branch] ?? p.branch}</div>`
            tooltipEl.style.display = "block"
          }
        })
        .on("mousemove", function (event: any) {
          if (!tooltipEl || !mapRectHost) return
          const rect = mapRectHost.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          tooltipEl.style.left = `${x + 12}px`
          tooltipEl.style.top = `${y - 10}px`
        })
        .on("mouseleave", function () {
          d3.select(this).attr("stroke-width", 0.5).attr("opacity", 1)
          if (tooltipEl) tooltipEl.style.display = "none"
        })
        .on("click", function (event: any, d: any) {
          const code = d.properties.prov_acr as string
          const p = byCode[code]
          if (!p) return
          setActiveBranch((prev) => (prev === p.branch ? null : p.branch))
        })

      pathSelectionRef.current = sel
    }

    const scheduleDraw = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(() => scheduleDraw())
    ro.observe(host)
    scheduleDraw()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [ready, byCode])

  useEffect(() => {
    const sel = pathSelectionRef.current
    if (!sel) return
    sel.attr("fill", (d: any) => getColor(d.properties.prov_acr)).attr("stroke", (d: any) => getStroke(d.properties.prov_acr))
  }, [activeBranch])

  const branchesToShow = activeBranch ? [activeBranch] : branches

  return (
    <Card className="border-none bg-white shadow-sm ring-1 ring-brand-navy/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-brand-navy">Territory Coverage Map</CardTitle>
        <CardDescription className="text-slate-500">
          Branch-wise coverage across Italy provinces. Click a province or choose a branch to filter.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveBranch(null)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                activeBranch === null
                  ? "border-brand-navy/20 bg-brand-navy/5 text-brand-navy"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {branches.map((b) => {
              const pal = BRANCH_PALETTE[b]
              const isActive = activeBranch === b
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setActiveBranch(b)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: isActive ? pal?.base ?? "#e2e8f0" : "#e2e8f0",
                    background: isActive ? `${pal?.base ?? "#0f172a"}22` : "#ffffff",
                    color: isActive ? pal?.base ?? "#0f172a" : "#475569",
                  }}
                >
                  {BRANCH_LABEL[b] ?? b}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div ref={mapHostRef} className="w-full" />
              <div
                ref={tooltipRef}
                style={{ display: "none" }}
                className="pointer-events-none absolute z-10 max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
              />
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-600">
                  {error}
                </div>
              ) : null}
              {!error && !ready ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-600">
                  Loading map…
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">Coverage summary</div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Provinces</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{stats.provincesCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Zones</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{stats.zones}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Branches</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{stats.branchesCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {branchesToShow.map((b) => {
                  const pal = BRANCH_PALETTE[b]
                  const zones = branchZones[b] ?? []
                  const count = PROVINCES.filter((p) => p.branch === b).length
                  return (
                    <div key={b} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ background: pal?.base ?? "#94a3b8" }} />
                        <div className="text-sm font-semibold text-slate-900">{BRANCH_LABEL[b] ?? b}</div>
                        <div className="ml-auto text-xs text-slate-500 tabular-nums">{count} prov.</div>
                      </div>
                      <div className="mt-3 flex flex-col gap-1.5">
                        {zones.map((z, idx) => {
                          const shade = pal?.shades[Math.min(idx + 1, (pal?.shades.length ?? 1) - 1)] ?? "#94a3b8"
                          const zoneCount = PROVINCES.filter((p) => p.zone === z).length
                          return (
                            <div key={z} className="flex items-center gap-2 text-xs">
                              <div className="h-2 w-2 rounded-sm" style={{ background: shade }} />
                              <div className="flex-1 text-slate-600">{shortZone(z)}</div>
                              <div className="text-slate-400 tabular-nums">{zoneCount}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
