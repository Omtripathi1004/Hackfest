import React, { useState, useMemo } from 'react';
import {
  MapPin,
  List,
  Map as MapIcon,
  Star,
  Search,
  Filter,
  Navigation,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Calculator,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { FALLBACK_SNAPSHOT } from '../src/data/fallbackSnapshot';
import { evaluateMandiList } from '../src/utils/calculations';

// Farmer home base coordinates (Lucknow rural central point)
const FARMER_BASE = {
  lat: 26.85,
  lng: 80.94,
  name: 'किसान केंद्र (Farmer Base - Lucknow)',
};

export function MandiMap({
  selectedCropKey = 'wheat',
  setSelectedCropKey,
  selectedMandiId,
  setSelectedMandiId,
  onNavigateTab,
  onPreFillFinance,
  onOpenChatWithMandi,
  savedMandiIds = [],
  onToggleSaveMandi,
  lang = 'hi',
}) {
  // View mode: 'map' or 'list'
  const [viewMode, setViewMode] = useState('map');

  // Filters state
  const [filterCrop, setFilterCrop] = useState(selectedCropKey || 'all');
  const [filterState, setFilterState] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState(150);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Map viewport zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hovered marker state for tooltip
  const [hoveredMandi, setHoveredMandi] = useState(null);

  // Synchronize internal filter with parent crop if parent changes
  React.useEffect(() => {
    if (selectedCropKey && selectedCropKey !== 'all') {
      setFilterCrop(selectedCropKey);
    }
  }, [selectedCropKey]);

  // Aggregate all mandis across crops or for selected crop
  const allMandisWithCrop = useMemo(() => {
    const list = [];
    const cropsToScan = filterCrop === 'all'
      ? Object.keys(FALLBACK_SNAPSHOT)
      : [filterCrop];

    cropsToScan.forEach((cKey) => {
      const cropData = FALLBACK_SNAPSHOT[cKey];
      if (!cropData) return;
      const { evaluated, bestMandi, trapMandi } = evaluateMandiList(cropData.mandis, 40);

      evaluated.forEach((m) => {
        list.push({
          ...m,
          cropKey: cKey,
          cropName: cropData.name,
          cropNameHi: cropData.nameHi,
          isBestNetProfit: bestMandi?.id === m.id,
          isTransportTrap: trapMandi?.id === m.id,
        });
      });
    });

    return list;
  }, [filterCrop]);

  // Extract unique states and districts for filters
  const availableStates = useMemo(() => {
    const set = new Set();
    allMandisWithCrop.forEach((m) => m.stateCode && set.add(m.stateCode));
    return Array.from(set);
  }, [allMandisWithCrop]);

  const availableDistricts = useMemo(() => {
    const set = new Set();
    allMandisWithCrop.forEach((m) => {
      if (filterState === 'all' || m.stateCode === filterState) {
        if (m.district) set.add(m.district);
      }
    });
    return Array.from(set).sort();
  }, [allMandisWithCrop, filterState]);

  // Filtered mandis list
  const filteredMandis = useMemo(() => {
    return allMandisWithCrop.filter((m) => {
      // Crop filter
      if (filterCrop !== 'all' && m.cropKey !== filterCrop) return false;

      // State filter
      if (filterState !== 'all' && m.stateCode !== filterState) return false;

      // District filter
      if (filterDistrict !== 'all' && m.district !== filterDistrict) return false;

      // Distance filter
      if (m.distanceKm > maxDistanceKm) return false;

      // Saved only filter
      if (showSavedOnly && !savedMandiIds.includes(m.id)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q) || m.nameHi?.includes(q);
        const matchDist = m.district?.toLowerCase().includes(q);
        if (!matchName && !matchDist) return false;
      }

      return true;
    });
  }, [allMandisWithCrop, filterCrop, filterState, filterDistrict, maxDistanceKm, showSavedOnly, savedMandiIds, searchQuery]);

  // Selected mandi details
  const activeMandi = useMemo(() => {
    if (!selectedMandiId) {
      return filteredMandis[0] || null;
    }
    return allMandisWithCrop.find((m) => m.id === selectedMandiId) || filteredMandis[0] || null;
  }, [selectedMandiId, allMandisWithCrop, filteredMandis]);

  // Coordinates to SVG projection calculation
  // Base SVG dimensions
  const svgWidth = 800;
  const svgHeight = 560;

  // Geographic bounds around North-Central India
  const geoBounds = {
    minLat: 19.5, // Covers Maharashtra (Nashik)
    maxLat: 28.5, // Covers Upper UP / Sitapur / Hardoi
    minLng: 73.5, // Covers Western RJ / Maharashtra
    maxLng: 83.0, // Covers Eastern UP (Pratapgarh, Varanasi)
  };

  const projectCoords = (lat, lng) => {
    const safeLat = lat || FARMER_BASE.lat;
    const safeLng = lng || FARMER_BASE.lng;

    // Normalizing between 0 and 1
    const xPct = (safeLng - geoBounds.minLng) / (geoBounds.maxLng - geoBounds.minLng);
    // Invert Y because SVG coordinates go down
    const yPct = 1 - (safeLat - geoBounds.minLat) / (geoBounds.maxLat - geoBounds.minLat);

    return {
      x: xPct * (svgWidth - 120) + 60,
      y: yPct * (svgHeight - 100) + 50,
    };
  };

  const farmerPos = projectCoords(FARMER_BASE.lat, FARMER_BASE.lng);

  // Drag pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetMap = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & View Toggle */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span className="text-[#22c55e]">🗺️</span>
              <span>{lang === 'hi' ? 'इंटरैक्टिव मंडी मानचित्र (Mandi Map)' : 'Interactive Mandi Map & Radar'}</span>
            </h2>
            <span className="bg-[#143021] text-[#22c55e] border border-[#22c55e]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
              {filteredMandis.length} {lang === 'hi' ? 'मंडियां दृश्यमान' : 'Mandis Visible'}
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            {lang === 'hi'
              ? 'स्थान, दूरी और वास्तविक भाव के आधार पर मंडियों का अन्वेषण करें। मंडी चुनकर सीधे P&L या तुलना में भेजें।'
              : 'Explore APMC mandis by coordinates, freight distance, and reported prices. Pinpoint transport traps.'}
          </p>
        </div>

        {/* View Mode Switcher & Saved Mandis Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              showSavedOnly
                ? 'bg-amber-500 text-stone-900 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-[#07130d] text-stone-300 border-[#1b3d2b] hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-stone-900' : 'text-amber-400'}`} />
            <span>
              {lang === 'hi' ? 'ट्रैक की गई मंडियां' : 'Tracked Mandis'} ({savedMandiIds.length})
            </span>
          </button>

          <div className="bg-[#07130d] p-1 rounded-xl border border-[#1b3d2b] flex items-center">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'map'
                  ? 'bg-[#22c55e] text-[#07130d] shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'मानचित्र' : 'Map'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-[#22c55e] text-[#07130d] shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सूची' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {lang === 'hi' ? 'खोजें (Search)' : 'Search Mandi'}
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'मंडी या जिला का नाम...' : 'Search by name or district...'}
              className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#22c55e]"
            />
          </div>
        </div>

        {/* Crop Selector */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {lang === 'hi' ? 'फसल (Crop)' : 'Crop Filter'}
          </label>
          <select
            value={filterCrop}
            onChange={(e) => {
              setFilterCrop(e.target.value);
              if (e.target.value !== 'all' && setSelectedCropKey) {
                setSelectedCropKey(e.target.value);
              }
            }}
            className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-300 focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">{lang === 'hi' ? 'सभी फसलें (All Crops)' : 'All Crops'}</option>
            {Object.keys(FALLBACK_SNAPSHOT).map((k) => (
              <option key={k} value={k}>
                {lang === 'hi' ? FALLBACK_SNAPSHOT[k].nameHi : FALLBACK_SNAPSHOT[k].name}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {lang === 'hi' ? 'राज्य (State)' : 'State'}
          </label>
          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setFilterDistrict('all');
            }}
            className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-200 focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">{lang === 'hi' ? 'सभी राज्य (All States)' : 'All States'}</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st === 'UP' ? 'Uttar Pradesh (उत्तर प्रदेश)' : st === 'RJ' ? 'Rajasthan (राजस्थान)' : st === 'MH' ? 'Maharashtra (महाराष्ट्र)' : st}
              </option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div>
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {lang === 'hi' ? 'जिला (District)' : 'District'}
          </label>
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="w-full bg-[#07130d] border border-[#1b3d2b] rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-200 focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">{lang === 'hi' ? 'सभी जिले (All Districts)' : 'All Districts'}</option>
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Distance Range Slider */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
            <span>{lang === 'hi' ? 'अधिकतम दूरी' : 'Max Distance'}</span>
            <span className="text-[#22c55e] font-mono">{maxDistanceKm} km</span>
          </div>
          <input
            type="range"
            min="15"
            max="1200"
            step="15"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="w-full accent-[#22c55e] bg-[#07130d] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-stone-500 font-mono mt-0.5">
            <span onClick={() => setMaxDistanceKm(50)} className="cursor-pointer hover:text-emerald-300">
              50 km
            </span>
            <span onClick={() => setMaxDistanceKm(100)} className="cursor-pointer hover:text-emerald-300">
              100 km
            </span>
            <span onClick={() => setMaxDistanceKm(300)} className="cursor-pointer hover:text-emerald-300">
              300 km
            </span>
            <span onClick={() => setMaxDistanceKm(1200)} className="cursor-pointer hover:text-emerald-300">
              All
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Map/List View + Marker Info Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Area: Map Vector View OR List View (8 columns) */}
        <div className="lg:col-span-8 bg-[#0d2117] border border-[#1b3d2b] rounded-2xl overflow-hidden relative shadow-lg">
          {viewMode === 'map' ? (
            <div
              className="relative w-full h-[520px] bg-[#07130d] select-none cursor-grab active:cursor-grabbing overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Map Floating Controls (Zoom, Reset, Legend) */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-[#0d2117]/90 backdrop-blur border border-[#1b3d2b] p-1 rounded-xl shadow-lg">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 text-stone-300 hover:text-white hover:bg-[#143021] rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  className="p-1.5 text-stone-300 hover:text-white hover:bg-[#143021] rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetMap}
                  className="p-1.5 text-stone-300 hover:text-white hover:bg-[#143021] rounded-lg transition"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Status Legend Pill */}
              <div className="absolute bottom-3 left-3 z-10 bg-[#0d2117]/90 backdrop-blur border border-[#1b3d2b] px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 text-[10px] text-stone-300 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                  <span>{lang === 'hi' ? 'आज का भाव (0-1d)' : 'Active (0-1d)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>{lang === 'hi' ? 'पुरानी दर (≥2d)' : 'Outdated (≥2d)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>{lang === 'hi' ? 'मंडी बंद / भाव नहीं' : 'No Rate / Closed'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>{lang === 'hi' ? 'सर्वाधिक शुद्ध मुनाफा' : 'Best Net'}</span>
                </div>
              </div>

              {/* Interactive Vector SVG Canvas */}
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#12281b" strokeWidth="0.8" />
                  </pattern>

                  {/* Pulsing Farmer Radar Glow */}
                  <radialGradient id="farmerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Background Grid */}
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Regional State Boundaries (Decorative schematic outlines) */}
                <g stroke="#1b3d2b" strokeWidth="1" strokeDasharray="3 3" fill="none">
                  {/* Uttar Pradesh schematic zone */}
                  <path d="M 320 120 Q 480 90 620 180 T 560 380 Q 400 320 320 280 Z" fill="#0d2318" fillOpacity="0.4" />
                  {/* Rajasthan schematic zone */}
                  <path d="M 120 160 Q 240 140 310 260 T 180 380 Z" fill="#14261d" fillOpacity="0.3" />
                  {/* Maharashtra schematic zone */}
                  <path d="M 140 400 Q 300 380 420 480 T 220 540 Z" fill="#12241b" fillOpacity="0.25" />
                </g>

                {/* Distance Concentric Circles from Farmer Home Base */}
                {[25, 50, 100, 200].map((dKm) => {
                  // Rough scale: 100 km ~ 120 SVG pixels
                  const radius = dKm * 1.25;
                  return (
                    <g key={dKm}>
                      <circle
                        cx={farmerPos.x}
                        cy={farmerPos.y}
                        r={radius}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="0.75"
                        strokeDasharray="4 4"
                        strokeOpacity="0.25"
                      />
                      <text
                        x={farmerPos.x + radius + 4}
                        y={farmerPos.y - 3}
                        fill="#22c55e"
                        fillOpacity="0.5"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {dKm} km
                      </text>
                    </g>
                  );
                })}

                {/* Farmer Base Anchor Marker */}
                <g>
                  <circle
                    cx={farmerPos.x}
                    cy={farmerPos.y}
                    r="24"
                    fill="url(#farmerGlow)"
                    className="animate-pulse"
                  />
                  <circle
                    cx={farmerPos.x}
                    cy={farmerPos.y}
                    r="7"
                    fill="#22c55e"
                    stroke="#07130d"
                    strokeWidth="2"
                  />
                  <text
                    x={farmerPos.x}
                    y={farmerPos.y - 12}
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="10"
                    fontWeight="900"
                    className="drop-shadow"
                  >
                    🚜 किसान केंद्र (Farmer Base)
                  </text>
                </g>

                {/* Mandi Connection Lines to Farmer Base */}
                {filteredMandis.map((mandi) => {
                  const mPos = projectCoords(mandi.lat, mandi.lng);
                  const isSelected = activeMandi?.id === mandi.id;
                  if (!isSelected && mandi.distanceKm > 90) return null;

                  return (
                    <line
                      key={`line-${mandi.id}`}
                      x1={farmerPos.x}
                      y1={farmerPos.y}
                      x2={mPos.x}
                      y2={mPos.y}
                      stroke={isSelected ? '#22c55e' : '#1b3d2b'}
                      strokeWidth={isSelected ? 1.75 : 0.75}
                      strokeDasharray={isSelected ? 'none' : '3 3'}
                      strokeOpacity={isSelected ? 0.9 : 0.4}
                    />
                  );
                })}

                {/* Mandi Marker Pins */}
                {filteredMandis.map((mandi) => {
                  const pos = projectCoords(mandi.lat, mandi.lng);
                  const isSelected = activeMandi?.id === mandi.id;
                  const isSaved = savedMandiIds.includes(mandi.id);

                  // Marker color coding based on data freshness
                  let pinColor = '#22c55e'; // Green for recent (0-1d)
                  if (mandi.todayModal === null) {
                    pinColor = '#f43f5e'; // Rose for closed / no rate
                  } else if (mandi.daysOld >= 2) {
                    pinColor = '#f59e0b'; // Amber for outdated
                  }

                  if (mandi.isBestNetProfit) {
                    pinColor = '#a855f7'; // Purple for best net profit
                  }

                  return (
                    <g
                      key={mandi.id}
                      className="cursor-pointer transition-transform duration-200"
                      onClick={() => setSelectedMandiId(mandi.id)}
                      onMouseEnter={() => setHoveredMandi(mandi)}
                      onMouseLeave={() => setHoveredMandi(null)}
                    >
                      {/* Pulse ring for selected mandi */}
                      {isSelected && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="16"
                          fill="none"
                          stroke={pinColor}
                          strokeWidth="2"
                          strokeOpacity="0.8"
                          className="animate-ping"
                        />
                      )}

                      {/* Main Marker Body */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 10 : 7}
                        fill={pinColor}
                        stroke="#07130d"
                        strokeWidth="2"
                        className="shadow-md"
                      />

                      {/* Star icon if saved */}
                      {isSaved && (
                        <circle
                          cx={pos.x + 6}
                          cy={pos.y - 6}
                          r="3"
                          fill="#f59e0b"
                          stroke="#07130d"
                          strokeWidth="1"
                        />
                      )}

                      {/* Mandi Name Label */}
                      <text
                        x={pos.x}
                        y={pos.y + 16}
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : '#94a3b8'}
                        fontSize={isSelected ? '10' : '9'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {mandi.name.split(' ')[0]} ({mandi.distanceKm}km)
                      </text>

                      {/* Price Tag Pill */}
                      <text
                        x={pos.x}
                        y={pos.y - 12}
                        textAnchor="middle"
                        fill={pinColor}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {mandi.todayModal ? `₹${mandi.todayModal}` : 'बंद'}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredMandi && (
                <div
                  className="absolute pointer-events-none z-20 bg-[#07130d]/95 border border-[#22c55e] px-3 py-2 rounded-xl text-xs text-white shadow-xl"
                  style={{
                    left: `${Math.min(svgWidth - 180, Math.max(10, projectCoords(hoveredMandi.lat, hoveredMandi.lng).x - 60))}px`,
                    top: `${Math.max(10, projectCoords(hoveredMandi.lat, hoveredMandi.lng).y - 65)}px`,
                  }}
                >
                  <div className="font-bold text-emerald-300">{hoveredMandi.name}</div>
                  <div className="text-[11px] text-stone-300">
                    {hoveredMandi.district} • {hoveredMandi.distanceKm} km
                  </div>
                  <div className="text-xs font-mono font-bold text-[#22c55e] mt-0.5">
                    {hoveredMandi.todayModal ? `₹${hoveredMandi.todayModal}/Qtl` : 'भाव उपलब्ध नहीं'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="p-4 divide-y divide-[#143021] max-h-[520px] overflow-y-auto">
              {filteredMandis.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs">
                  {lang === 'hi'
                    ? 'कोई मंडी नहीं मिली। कृपया अपने फिल्टर ढीले करें।'
                    : 'No mandis match your filters. Try adjusting your distance or search.'}
                </div>
              ) : (
                filteredMandis.map((mandi) => {
                  const isSelected = activeMandi?.id === mandi.id;
                  const isSaved = savedMandiIds.includes(mandi.id);

                  return (
                    <div
                      key={mandi.id}
                      onClick={() => setSelectedMandiId(mandi.id)}
                      className={`p-3 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#143021] border border-[#22c55e]/50'
                          : 'hover:bg-[#07130d]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaveMandi && onToggleSaveMandi(mandi.id);
                          }}
                          className="mt-1 text-stone-400 hover:text-amber-400"
                          title="Save / Track Mandi"
                        >
                          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{mandi.name}</span>
                            <span className="text-xs text-stone-400">({mandi.nameHi})</span>
                            {mandi.isBestNetProfit && (
                              <span className="bg-purple-950 text-purple-300 border border-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                BEST NET
                              </span>
                            )}
                            {mandi.isTransportTrap && (
                              <span className="bg-amber-950 text-amber-300 border border-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                TRAP
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                            <span>{mandi.district}, {mandi.stateCode}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-bold">{mandi.distanceKm} km</span>
                            <span>•</span>
                            <span className="text-[11px] text-stone-300">{mandi.statusBadge}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:justify-end">
                        <div className="text-right">
                          <div className="text-base font-black text-[#22c55e] font-mono">
                            {mandi.todayModal ? `₹${mandi.todayModal}/Qtl` : 'भाव नहीं'}
                          </div>
                          {mandi.netReturnPerQtl && (
                            <div className="text-[11px] text-stone-300">
                              शुद्ध: <strong className="text-white">₹{mandi.netReturnPerQtl}</strong>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreFillFinance && onPreFillFinance(mandi);
                            }}
                            className="bg-[#22c55e] text-[#07130d] text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#16a34a] transition"
                            title="Calculate P&L with this mandi"
                          >
                            P&L
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateTab && onNavigateTab('radar', mandi);
                            }}
                            className="bg-[#143021] text-emerald-300 text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-900 border border-emerald-600 transition"
                            title="Compare in Profit Radar"
                          >
                            Compare
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Area: Marker Info Drawer / Card (4 columns) */}
        <div className="lg:col-span-4 bg-[#0d2117] border border-[#1b3d2b] rounded-2xl p-4 space-y-4 shadow-xl">
          {activeMandi ? (
            <>
              {/* Mandi Hero Header */}
              <div className="border-b border-[#1b3d2b] pb-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-white">{activeMandi.name}</h3>
                    <p className="text-xs text-emerald-300 font-semibold">{activeMandi.nameHi}</p>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>{activeMandi.district}, {activeMandi.stateCode}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400 font-bold">{activeMandi.distanceKm} km</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleSaveMandi && onToggleSaveMandi(activeMandi.id)}
                    className="p-2 bg-[#07130d] border border-[#1b3d2b] hover:border-amber-400 rounded-xl transition"
                    title={savedMandiIds.includes(activeMandi.id) ? 'Remove from Tracked' : 'Save / Track Mandi'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        savedMandiIds.includes(activeMandi.id)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-400 hover:text-amber-400'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Price Hero Display */}
              <div className="bg-[#07130d] border border-[#1b3d2b] rounded-xl p-3.5">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {lang === 'hi' ? 'आज का मॉडल भाव (Reported Modal Price)' : 'Today Modal Price'}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[#22c55e] font-mono tracking-tight">
                    {activeMandi.todayModal ? `₹${activeMandi.todayModal}` : 'भाव उपलब्ध नहीं'}
                  </span>
                  {activeMandi.todayModal && (
                    <span className="text-xs text-stone-400 font-medium">/Quintal</span>
                  )}
                </div>

                {/* Price Movement vs Yesterday */}
                {activeMandi.priceDiff !== null && activeMandi.priceDiff !== undefined && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold">
                    {activeMandi.priceDiff > 0 ? (
                      <span className="text-[#22c55e] flex items-center gap-1 bg-[#22c55e]/10 px-2 py-0.5 rounded">
                        <TrendingUp className="w-3.5 h-3.5" /> +₹{activeMandi.priceDiff} vs Yesterday
                      </span>
                    ) : activeMandi.priceDiff < 0 ? (
                      <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded">
                        <TrendingDown className="w-3.5 h-3.5" /> -₹{Math.abs(activeMandi.priceDiff)} vs Yesterday
                      </span>
                    ) : (
                      <span className="text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                        Flat vs Yesterday
                      </span>
                    )}
                  </div>
                )}

                {/* Data Freshness Badge */}
                <div className="mt-2.5 pt-2.5 border-t border-[#143021] flex items-center justify-between text-[11px] text-stone-300">
                  <span className="flex items-center gap-1.5 text-stone-400">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{activeMandi.lastReportedDate}</span>
                  </span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      activeMandi.todayModal === null
                        ? 'bg-rose-950 text-rose-300 border border-rose-600'
                        : activeMandi.daysOld >= 2
                        ? 'bg-amber-950 text-amber-300 border border-amber-600'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    }`}
                  >
                    {activeMandi.statusBadge.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Estimated Freight & Net In-Pocket */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#07130d] border border-[#1b3d2b] p-2.5 rounded-xl">
                  <span className="text-[10px] text-stone-400 block">
                    {lang === 'hi' ? 'अनुमानित भाड़ा (Freight)' : 'Freight / Qtl'}
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{(activeMandi.distanceKm * 0.95).toFixed(1)}/q
                  </span>
                  <span className="text-[9px] text-stone-500 block">@ ₹0.95/km</span>
                </div>
                <div className="bg-[#07130d] border border-[#1b3d2b] p-2.5 rounded-xl">
                  <span className="text-[10px] text-stone-400 block">
                    {lang === 'hi' ? 'शुद्ध हाथ में (Net Return)' : 'Net In-Pocket'}
                  </span>
                  <span className="font-mono font-bold text-[#22c55e] text-sm">
                    {activeMandi.todayModal
                      ? `₹${(activeMandi.todayModal - activeMandi.distanceKm * 0.95 - 18).toFixed(1)}/q`
                      : 'N/A'}
                  </span>
                  <span className="text-[9px] text-stone-500 block">भाड़ा व हम्माली काटकर</span>
                </div>
              </div>

              {/* Transport Trap Warning if detected */}
              {activeMandi.isTransportTrap && (
                <div className="bg-amber-950/60 border border-amber-600/70 p-2.5 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">भाड़ा जाल (Transport Trap) सतर्कता:</strong>
                    दूरी ({activeMandi.distanceKm} किमी) अधिक होने के कारण अधिक भाव के बावजूद शुद्ध बचत कम होगी!
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Calculate P&L button (pre-fills finance page) */}
                <button
                  onClick={() => onPreFillFinance && onPreFillFinance(activeMandi)}
                  className="w-full bg-[#22c55e] text-[#07130d] font-black text-xs py-2.5 rounded-xl hover:bg-[#16a34a] transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'इस मंडी का P&L निकालें (Calculate P&L)' : 'Calculate P&L for this Mandi'}</span>
                </button>

                {/* 2. Compare Prices button (switches to Profit Radar) */}
                <button
                  onClick={() => onNavigateTab && onNavigateTab('radar', activeMandi)}
                  className="w-full bg-[#143021] border border-[#22c55e]/50 hover:bg-emerald-900 text-emerald-100 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'अन्य मंडियों से तुलना करें (Compare)' : 'Compare with Other Mandis'}</span>
                </button>

                {/* 3. Ask Gemini AI about this Mandi */}
                <button
                  onClick={() => onOpenChatWithMandi && onOpenChatWithMandi(activeMandi)}
                  className="w-full bg-[#07130d] border border-[#1b3d2b] hover:border-emerald-500 text-stone-300 hover:text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>{lang === 'hi' ? 'Gemini AI से इस मंडी पर सलाह लें' : 'Ask Gemini AI about this Mandi'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-stone-400 text-xs">
              {lang === 'hi' ? 'विवरण देखने के लिए किसी मंडी पर क्लिक करें' : 'Click on any marker pin to view details'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MandiMap;
