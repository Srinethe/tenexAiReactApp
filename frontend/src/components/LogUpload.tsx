import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL_WITH_API = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

interface LogUploadProps {
  onUploadSuccess: () => void;
}

const LogUpload: React.FC<LogUploadProps> = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = (file: File) => {
    // Only allow .csv files
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are allowed');
      return;
    }
    setUploading(true);
    setProgress(0);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL_WITH_API}/logs/upload`, true);
    const token = authService.getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      setProgress(0);
      if (xhr.status === 201) {
        onUploadSuccess();
      } else {
        setError(xhr.responseText || 'Upload failed');
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError('Upload failed');
    };
    xhr.send(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors duration-200 ${dragActive ? 'border-cyan-600 bg-cyan-50' : 'border-gray-300 bg-white'}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        <svg className="h-10 w-10 text-cyan-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
        </svg>
        <p className="text-black font-medium mb-1">Drag & drop your csv log file here</p>
        <p className="text-gray-500 text-sm">or click to select a file (.csv)</p>
        {uploading && (
          <div className="w-full mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-cyan-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Uploading... {progress}%</p>
          </div>
        )}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default LogUpload; 