import React from 'react';
import { Button } from '@/components/ui/button';

const DescriptionModal = ({ open, onClose, description }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <button
          className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>
        <h2 className="mb-4 text-xl font-semibold">About this space</h2>
        <div
          className="text-gray-800 overflow-y-auto"
          style={{
            whiteSpace: 'pre-line',
            maxHeight: '60vh', // Giới hạn chiều cao, phần còn lại sẽ cuộn
          }}
          dangerouslySetInnerHTML={{
            __html: description
              ? description.replace(/<br\s*\/?>/gi, '<br/>')
              : '',
          }}
        />
      </div>
    </div>
  );
};

export default DescriptionModal;