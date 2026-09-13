import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Search,
  Crosshair,
  Loader2,
  ShieldCheck,
  Building,
  Store,
  ExternalLink,
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
} from '../services/kendraLocationService';
import { getSavedProfile } from '../services/storageService';
import { useTranslation } from '../hooks/useTranslation';

export const KendraFinderPage: React.FC = () => {
  const { t } = useTranslation();
  const userProfile = getSavedProfile();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    detectLocationFromApimitra()
      .then((detected) => {
        if (isMounted) {
          setLocation(detected);
          if (detected.pincode) {
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
  }, []);

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

  // Capture live GPS location from device
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
      console.warn('GPS detection failed:', err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950 min-h-screen py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Hero */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Store className="w-4 h-4" />
              <span>National Citizen Service Directory</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-teal-200">APIMitra Locality API</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Nearest Kendra Finder (CSC / e-Mitra / MeeSeva)
            </h1>

            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Find authorized village & urban service kiosks for offline welfare scheme applications, Aadhaar biometric e-KYC authentication, document scans, certificate issuance, and direct DBT assistance.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {location && (
                <>
                  <a
                    href={getLiveGoogleMapsSearchUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={getOfficialPortalLink(location.state).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>{getOfficialPortalLink(location.state).name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search & Location Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleLocationSearch} className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter 6-digit Pincode or City / District (e.g. 302001, Jaipur, Delhi)..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-2xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Find Kendras</span>
              </button>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Detect live GPS location from device"
              >
                <Crosshair className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Use GPS</span>
              </button>
            </form>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
              {['All', 'CSC Digital Seva', 'e-Mitra', 'MeeSeva', 'Maha e-Seva'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    if (location) {
                      const list = generateNearestKendras(location, { filterType: type });
                      setKendras(list);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedType === type
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Crosshair className="w-4 h-4 text-teal-600 animate-pulse" />
              <span>Current Search Radius:</span>
              <strong className="text-slate-900 dark:text-white">
                {location ? `${location.city}, ${location.state} (${location.pincode})` : 'Detecting...'}
              </strong>
              {location?.source === 'apimitra_ip' && (
                <span className="text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md font-bold">
                  APIMitra IP Detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Quick State:</span>
              {[
                { label: 'Delhi', state: 'Delhi', city: 'New Delhi', pin: '110001', lat: 28.6139, lon: 77.209 },
                { label: 'Rajasthan', state: 'Rajasthan', city: 'Jaipur', pin: '302001', lat: 26.9124, lon: 75.7873 },
                { label: 'Andhra Pradesh', state: 'Andhra Pradesh', city: 'Vijayawada', pin: '520001', lat: 16.5062, lon: 80.648 },
                { label: 'Maharashtra', state: 'Maharashtra', city: 'Mumbai', pin: '400001', lat: 18.9388, lon: 72.8354 },
                { label: 'Karnataka', state: 'Karnataka', city: 'Bengaluru', pin: '560001', lat: 12.9716, lon: 77.5946 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSelectState(s.state, s.city, s.pin, s.lat, s.lon)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Google Maps Direct Banner */}
        {location && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Live Google Maps CSC & e-Mitra Locator
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Direct search on Google Maps showing all verified e-Governance centers, VLE kiosks, and cyber cafes in {location.city || location.district} ({location.pincode}).
                </p>
              </div>
            </div>
            <a
              href={getLiveGoogleMapsSearchUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span>Search on Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Nearest Verified Centers ({kendras.length})
            </h2>
            {location && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Official Portal:</span>
                <a
                  href={getOfficialPortalLink(location.state).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>{getOfficialPortalLink(location.state).name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-10 h-10 animate-spin text-teal-700 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Fetching authentic Kendra coordinates via APIMitra API...
              </p>
            </div>
          ) : kendras.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <Store className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Centers Found for this Pincode / District
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try searching with a nearby postal code or pick one of the state presets above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kendras.map((kendra) => (
                <div
                  key={kendra.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                          <Building className="w-3.5 h-3.5" />
                          {kendra.kendraType}
                        </span>
                        {kendra.isPostOfficeHub && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                            🏛️ India Post IPSK
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            kendra.isOpenNow
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {kendra.isOpenNow ? '● Open Now' : '○ Closed'}
                        </span>
                        <span className="text-xs font-black text-teal-800 dark:text-emerald-400">
                          {kendra.distanceKm} km away
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-900 dark:group-hover:text-teal-300 transition-colors">
                        {kendra.name}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>Operator: <strong>{kendra.vleName}</strong></span>
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

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{kendra.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{kendra.openingHours}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {kendra.services.map((srv, idx) => (
                        <span
                          key={idx}
                          className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={`tel:${kendra.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={kendra.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        title="Search this center on Google Maps"
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
      </div>
    </div>
  );
};
