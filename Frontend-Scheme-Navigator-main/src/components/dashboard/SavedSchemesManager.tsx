import React from 'react';
import { Scheme } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Trash2, GripVertical } from 'lucide-react';
import { toggleSaveScheme } from '../../services/storageService';

interface SavedSchemesManagerProps {
  schemes: Scheme[];
  onRefresh: () => void;
  onDragStart?: (scheme: Scheme) => void;
  onDragEnd?: () => void;
}

export const SavedSchemesManager: React.FC<SavedSchemesManagerProps> = ({
  schemes,
  onRefresh,
  onDragStart,
  onDragEnd,
}) => {
  const handleRemove = (id: string) => {
    toggleSaveScheme(id);
    onRefresh();
  };

  if (schemes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <Bookmark className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Saved Schemes Yet</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Bookmark schemes while exploring to review benefits, share with family, and prepare application documents.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          <span>Explore All Schemes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Bookmarked & Saved Schemes
          </h3>
          <p className="text-xs text-slate-500">
            Drag a card up to the Guidance Tracker to start tracking it, or quickly access schemes you've shortlisted.
          </p>
        </div>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
          {schemes.length} Saved
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schemes.map((scheme) => (
          <div
            key={scheme.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData('schemeId', scheme.id);
              onDragStart?.(scheme);
            }}
            onDragEnd={onDragEnd}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 active:border-teal-400"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
                  <StatusPill type="category" value={scheme.category} size="sm" />
                </div>
                <button
                  onClick={() => handleRemove(scheme.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1">
                <Link to={`/schemes/${scheme.slug}`} onClick={(e) => e.stopPropagation()}>
                  {scheme.name}
                </Link>
              </h4>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {scheme.shortDescription}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                {scheme.level} Scheme
              </span>

              <Link
                to={`/schemes/${scheme.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 group-hover:translate-x-0.5 transition-all"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
