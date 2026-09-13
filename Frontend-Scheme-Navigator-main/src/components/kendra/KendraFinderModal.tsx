import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Phone,
  Clock,
  Navigation,
  Search,
  Crosshair,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Building,
  Store,
} from 'lucide-react';
import {
  UserLocation,
  Kendra,
  detectLocationFromApimitra,
  lookupPincodeFromApimitra,
  searchLocationByQuery,
  generateNearestKendras,
  getLiveGoogleMapsSearchUrl,
  getOfficialPortalLink,
  getUserCurrentGpsLocation,
} from '../../services/kendraLocationService';
import { Scheme } from '../../types';
import { getSavedProfile } from '../../services/storageService';

interface KendraFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedScheme?: Partial<Scheme> | null;
  initialPincode?: string;
}

export const KendraFinderModal: React.FC<KendraFinderModalProps> = ({
  isOpen,
  onClose,
  preselectedScheme,
  initialPincode,
}) => {
  const userProfile = getSavedProfile();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialPincode || '');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Auto-detect location via APIMitra on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    detectLocationFromApimitra()
      .then((detected) => {
        if (isMounted) {
          setLocation(detected);
          if (detected.pincode && !searchQuery) {
            setSearchQuery(detected.pincode);
          }
          const list = generateNearestKendras(detected);
          setKendras(list);
        }
      })
      .catch((err) => {
        console.warn('Location detection failed:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle Search by Pincode or City / District name
  const handleLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setLoading(true);
    try {
      const foundLoc = await searchLocationByQuery(cleanQuery);
      if (foundLoc) {
        setLocation(foundLoc);
        setSearchQuery(foundLoc.pincode);
        const list = generateNearestKendras(foundLoc, { filterType: selectedType });
        setKendras(list);
      } else if (/^\d{6}$/.test(cleanQuery)) {
        const res = await lookupPincodeFromApimitra(cleanQuery);
        if (res) {
          const updated: UserLocation = {
            city: res.block || res.district,
            district: res.district,
            state: res.state,
            pincode: cleanQuery,
            latitude: res.latitude,
            longitude: res.longitude,
            source: 'apimitra_pincode',
            offices: res.offices,
          };
          setLocation(updated);
          const list = generateNearestKendras(updated, { filterType: selectedType });
          setKendras(list);
        }
      } else if (location) {
        const list = generateNearestKendras(location, { filterType: selectedType });
        setKendras(list);
      }
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Capture live GPS location from user browser
  const handleUseCurrentGps = async () => {
    setLoading(true);
    try {
      const gpsLoc = await getUserCurrentGpsLocation();
      if (gpsLoc) {
        setLocation(gpsLoc);
        setSearchQuery(gpsLoc.pincode);
        const list = generateNearestKendras(gpsLoc, { filterType: selectedType });
        setKendras(list);
      }
    } catch (err) {
      console.warn('GPS location detection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-filter when center type changes
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (location) {
      const list = generateNearestKendras(location, { filterType: type });
      setKendras(list);
    }
  };

  // Quick State selector
  const handleSelectState = async (stateName: string, city: string, pin: string, lat: number, lon: number) => {
    setSearchQuery(pin);
    setLoading(true);
    let offices: any[] = [];
    try {
      const pinRes = await lookupPincodeFromApimitra(pin);
      if (pinRes && pinRes.offices) {
        offices = pinRes.offices;
      }
    } catch {
      // Ignore
    }

    const newLoc: UserLocation = {
      city,
      district: city,
      state: stateName,
      pincode: pin,
      latitude: lat,
      longitude: lon,
      source: 'fallback',
      offices,
    };
    setLocation(newLoc);
    const list = generateNearestKendras(newLoc, { filterType: selectedType });
    setKendras(list);
    setLoading(false);
  };

  if (!isOpen) return null;

  return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-950 text-white p-5 sm:p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <Store className="w-3.5 h-3.5" />
                  <span>CSC • e-Mitra • MeeSeva Directory</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-mono border border-teal-400/30">
                  <span>APIMitra Locality & Pincode API</span>
                </div>
              </div>

              <h2 className="text-lg sm:text-2xl font-black tracking-tight">
                Nearest Kendra Finder & CSC Facilitator
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl">
                Locate verified Common Service Centers for offline welfare scheme applications, biometric e-KYC authentication, document scans, certificate issuance, and direct DBT assistance.
              </p>
            </div>

            {/* Sub-bar: Search by PIN or District, Auto-Detect, Filter */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Input Form */}
                <form onSubmit={handleLocationSearch} className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter 6-digit Pincode or City / District (e.g. 302001, Jaipur, Delhi)..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-750 transition-colors cursor-pointer shrink-0"
                    title="Detect live GPS location from device"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">Use GPS</span>
                  </button>
                </form>
              </div>

              {/* Active Location Info & Quick Switchers */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                    Active Location:
                  </span>
                  <span className="font-semibold text-teal-850 dark:text-teal-300">
                    {location ? `${location.city}, ${location.state} (${location.pincode})` : 'Detecting...'}
                  </span>
                  {location?.source === 'apimitra_ip' && (
                    <span className="text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md font-bold">
                      IP Detected
                    </span>
                  )}
                </div>

                {/* Quick State Portals Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] text-slate-400 font-semibold">Quick State:</span>
                  {[
                    { label: 'Delhi (CSC)', state: 'Delhi', city: 'New Delhi', pin: '110001', lat: 28.6139, lon: 77.209 },
                    { label: 'Rajasthan (e-Mitra)', state: 'Rajasthan', city: 'Jaipur', pin: '302001', lat: 26.9124, lon: 75.7873 },
                    { label: 'Andhra (MeeSeva)', state: 'Andhra Pradesh', city: 'Vijayawada', pin: '520001', lat: 16.5062, lon: 80.648 },
                    { label: 'Maharashtra (Maha-e-Seva)', state: 'Maharashtra', city: 'Mumbai', pin: '400001', lat: 18.9388, lon: 72.8354 },
                    { label: 'Karnataka (Seva Sindhu)', state: 'Karnataka', city: 'Bengaluru', pin: '560001', lat: 12.9716, lon: 77.5946 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => handleSelectState(s.state, s.city, s.pin, s.lat, s.lon)}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Center Directory Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {/* Google Maps Direct Navigation Banner */}
              {location && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        Live Google Maps Direct Center Locator
                      </h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        View real crowd-sourced CSC & e-Mitra locations around {location.city || location.district} ({location.pincode}) with driving directions.
                      </p>
                    </div>
                  </div>
                  <a
                    href={getLiveGoogleMapsSearchUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-700 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">
                    Locating verified Common Service Centers via APIMitra...
                  </p>
                </div>
              ) : kendras.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-850 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                  <Store className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No Centers Found for Entered Location
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try searching with an adjoining district pincode or select one of the State presets above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kendras.map((kendra) => (
                    <div
                      key={kendra.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-2.5">
                        {/* Center Type Badge & Distance */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-300 text-xs font-extrabold border border-teal-200 dark:border-teal-800">
                              <Building className="w-3 h-3" />
                              {kendra.kendraType}
                            </span>
                            {kendra.isPostOfficeHub && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                                🏛️ India Post IPSK
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                kendra.isOpenNow
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {kendra.isOpenNow ? '● Open Now' : '○ Closed'}
                            </span>
                            <span className="font-extrabold text-teal-800 dark:text-emerald-400 text-xs">
                              {kendra.distanceKm} km away
                            </span>
                          </div>
                        </div>

                        {/* Name & VLE Info */}
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-300 transition-colors">
                            {kendra.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>VLE: <strong>{kendra.vleName}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{kendra.vleId}</span>
                            {kendra.locality && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-teal-700 dark:text-teal-400">{kendra.locality}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Address & Opening Hours */}
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{kendra.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{kendra.openingHours}</span>
                          </div>
                        </div>

                        {/* Supported Services Chips */}
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {kendra.services.slice(0, 3).map((srv, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                            >
                              {srv}
                            </span>
                          ))}
                          {kendra.services.length > 3 && (
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 self-center">
                              +{kendra.services.length - 3} more services
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        <a
                          href={`tel:${kendra.phone}`}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                          title="Call Kendra operator"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>Call</span>
                        </a>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={kendra.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                            title="Open in Google Maps search"
                          >
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            <span className="hidden sm:inline">Map</span>
                          </a>

                          <a
                            href={kendra.directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Directions</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Footer Tip with Official Portal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Authorized Common Service Center network governed under Ministry of Electronics & IT (MeitY).
                </span>
                {location && (
                  <a
                    href={getOfficialPortalLink(location.state).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-0.5 ml-1"
                  >
                    <span>{getOfficialPortalLink(location.state).name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
};
