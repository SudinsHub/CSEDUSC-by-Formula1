'use client';

import { Download } from 'lucide-react';
import Modal from './Modal';

interface FileViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export default function FileViewerModal({
  open,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FileViewerModalProps) {
  const isPdf = fileType.toLowerCase().includes('pdf');
  const isImage = fileType.toLowerCase().startsWith('image/');
  const downloadUrl = `${fileUrl}?download=true`;

  return (
    <Modal open={open} onClose={onClose} title={fileName} size="xl">
      <div className="flex flex-col gap-4">
        {/* Viewer Area */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[300px]">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-[65vh]"
              title={fileName}
            />
          ) : isImage ? (
            <div className="max-h-[65vh] p-2 flex items-center justify-center overflow-auto">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Preview not supported for this file type.</p>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 text-gold-400 rounded-lg font-medium hover:bg-navy-700 transition"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <a
            href={downloadUrl}
            download
            className="btn-gold flex items-center gap-2 px-4 py-2"
          >
            <Download className="w-4 h-4" /> Download
          </a>
          <button
            onClick={onClose}
            className="btn-outline px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
