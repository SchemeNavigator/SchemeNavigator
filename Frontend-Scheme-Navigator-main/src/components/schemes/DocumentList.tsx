import React, { useState } from 'react';
import { DocumentRequirement } from '../../types';
import { FileText, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react';

interface DocumentListProps {
  documents: DocumentRequirement[];
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'identity':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'income':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'education':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'bank':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'caste':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Documents You May Need
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep clear digital scans (PDF/JPG under 200KB) ready before starting the online application.
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {Object.values(checkedDocs).filter(Boolean).length} of {documents.length} prepared
        </span>
      </div>

      {/* Document Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.map((doc) => {
          const isReady = !!checkedDocs[doc.id];
          return (
            <div
              key={doc.id}
              onClick={() => toggleDoc(doc.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                isReady
                  ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isReady ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isReady && <CheckCircle2 className="w-4 h-4" />}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {doc.name}
                  </span>
                  {doc.isMandatory && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Mandatory
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {doc.description}
                </p>

                <div className="pt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getDocTypeBadge(doc.documentType)}`}>
                    {doc.documentType.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Document Reminder:</strong> Required documents may vary by state implementation. Please cross-verify the latest circular on the official portal before final submission.
        </span>
      </div>
    </div>
  );
};
