import { useState, useRef } from 'react';
import { useFinancialData } from '../hooks/useFinancialData';

export default function UploadModal({ onClose }) {
  const { uploadAndAnalyze, isLoading, error } = useFinancialData();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const ok = await uploadAndAnalyze(file);
    if (ok) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <h2 className="modal-title" id="upload-title">Upload your data</h2>
        <p className="modal-sub">
          Export a CSV from QuickBooks, Xero, or any accounting tool. Needs columns: date, type, category, amount.
        </p>
        <div
          className={`drop-zone ${dragging ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Click or drag a CSV file here"
        >
          <div className="drop-zone-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="drop-zone-text">
            {file
              ? <strong>{file.name}</strong>
              : <><strong>Click to browse</strong> or drag your CSV here</>
            }
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!file || isLoading}
          >
            {isLoading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}
