import React, { useState } from 'react';
import { TrackerItem, ApplicationStatus, Scheme } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Link } from 'react-router-dom';
import {
  Clock,
  Trash2,
  ExternalLink,
  ArrowRight,
  Info,
  PlusCircle,
} from 'lucide-react';
import { removeTrackerItem, updateTrackerStatus } from '../../services/storageService';

interface GuidanceTrackerProps {
  items: TrackerItem[];
  onRefresh: () => void;
  isDragActive?: boolean;
  onDropScheme?: (scheme: Scheme) => void;
}

export const GuidanceTracker: React.FC<GuidanceTrackerProps> = ({
  items,
  onRefresh,
  isDragActive = false,
  onDropScheme,
}) => {
  const [isOver, setIsOver] = useState(false);

  const statuses: ApplicationStatus[] = [
    'Exploring',
    'Documents Needed',
    'Ready to Apply',
    'Applied Externally',
    'Completed',
  ];

  const handleStatusChange = (schemeId: string, schemeName: string, category: any, newStatus: ApplicationStatus) => {
    updateTrackerStatus(schemeId, schemeName, category, newStatus);
    onRefresh();
  };

  const handleRemove = (schemeId: string) => {
    removeTrackerItem(schemeId);
    onRefresh();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const schemeId = e.dataTransfer.getData('schemeId');
    if (schemeId && onDropScheme) {
      // Find scheme from the data transfer — resolved in parent via schemeId
      onDropScheme({ id: schemeId } as Scheme);
    }
  };

  const dropZoneClass = isOver
    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400 ring-offset-1'
    : isDragActive
    ? 'border-teal-300 bg-teal-50/60 border-dashed'
    : 'border-slate-200';

  if (items.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-3xl p-8 sm:p-12 border-2 text-center space-y-4 shadow-sm transition-all duration-200 ${dropZoneClass} ${isOver ? '' : 'bg-white'}`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-colors ${isOver ? 'bg-teal-100 text-teal-700' : 'bg-teal-50 text-teal-700'}`}>
          {isOver ? <PlusCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {isOver ? 'Release to Add to Tracker' : isDragActive ? 'Drop Here to Track This Scheme' : 'No Applications in Guidance Tracker Yet'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          {isOver || isDragActive
            ? 'The scheme will be added to your guidance tracker at "Exploring" stage.'
            : 'When exploring schemes, click "Track in My Dashboard" to organize required documents, track readiness, and monitor your progress.'}
        </p>
        {!isDragActive && (
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <span>Explore Recommended Schemes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Application Guidance & Journey Tracker
          </h3>
          <p className="text-xs text-slate-500">
            Organize documents and mark milestones as you complete official portal submissions.
          </p>
        </div>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
          {items.length} Active {items.length === 1 ? 'Scheme' : 'Schemes'}
        </span>
      </div>

      {/* Drop zone strip — always visible when a drag is active */}
      {isDragActive && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-4 px-5 text-sm font-semibold transition-all duration-150 ${
            isOver
              ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-300 ring-offset-1'
              : 'border-teal-300 bg-teal-50/50 text-teal-600'
          }`}
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          <span>{isOver ? 'Release to add to tracker' : 'Drop scheme here to add to tracker'}</span>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Scheme Info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <StatusPill type="category" value={item.category} size="sm" />
                <StatusPill type="status" value={item.status} size="sm" />
              </div>

              <h4 className="text-base font-bold text-slate-900">
                <Link to={`/schemes/${item.schemeId}`} className="hover:text-teal-800 transition-colors">
                  {item.schemeName}
                </Link>
              </h4>

              {item.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                  "{item.notes}"
                </p>
              )}
            </div>

            {/* Status Selector & Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Update Stage:
                </label>
                <select
                  value={item.status}
                  onChange={(e) =>
                    handleStatusChange(
                      item.schemeId,
                      item.schemeName,
                      item.category,
                      e.target.value as ApplicationStatus
                    )
                  }
                  className="px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 rounded-xl text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 self-end">
                <Link
                  to={`/schemes/${item.schemeId}`}
                  className="p-2 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                  title="View Scheme Details"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleRemove(item.schemeId)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Remove from tracker"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Reminder:</strong> SchemeNavigator is a navigation guidance platform. All application processing, biometric approvals, and funds transfers are executed by the designated government department.
        </span>
      </div>
    </div>
  );
};
