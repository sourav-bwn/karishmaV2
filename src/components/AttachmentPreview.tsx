import React from "react";
import { motion } from "motion/react";
import { Sparkles, X, FileText, CircleAlert, RotateCcw, Download } from "lucide-react";

/**
 * Attachment preview box shown above the composer while an attachment is
 * pending, including the Ghibli-art illustration transform flow.
 * Extracted verbatim (logic unchanged) from the pre-redesign App shell.
 */

export interface AttachmentPreviewData {
  name: string;
  type: string;
  dataUrl: string;
  size?: number;
  isImage?: boolean;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface AttachmentPreviewProps {
  attachment: AttachmentPreviewData | null;
  isTransforming: boolean;
  transformedUrl: string | null;
  error: string | null;
  onGenerate: () => void;
  onDownload: () => void;
  onClear: () => void;
}

export function AttachmentPreview({
  attachment,
  isTransforming,
  transformedUrl,
  error,
  onGenerate,
  onDownload,
  onClear,
}: AttachmentPreviewProps) {
  if (!attachment) return null;

  return (
    <div className="flex flex-col gap-2 bg-[#FAF8F5] border border-[#EBE6DD] p-3 rounded-2xl text-xs shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {attachment.isImage || attachment.type?.startsWith("image/") ? (
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="w-12 h-12 object-cover rounded-xl border border-[#EBE6DD] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] border border-[#F3D9C9] flex items-center justify-center shrink-0 text-[#D96B43]">
              <FileText className="w-6 h-6" />
            </div>
          )}
          <div className="truncate">
            <p className="font-semibold text-[#2C2A29] truncate">{attachment.name}</p>
            <p className="text-[10px] text-[#8C857E]">
              {attachment.name.split('.').pop()?.toUpperCase() || 'FILE'} {attachment.size ? `• ${formatFileSize(attachment.size)}` : ''} • Ready to send
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {(attachment.isImage || attachment.type?.startsWith("image/")) && !transformedUrl && (
            <button
              id="btn-make-ghibli-art"
              type="button"
              onClick={onGenerate}
              disabled={isTransforming}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF0E6] hover:bg-[#F3D9C9] text-[#D96B43] font-bold rounded-xl border border-[#F3D9C9] transition-all cursor-pointer disabled:opacity-50 text-xs shadow-2xs"
              title="Transform this image into an original hand-drawn Japanese Ghibli art illustration"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isTransforming ? "Generating..." : "Make it Ghibli art"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-[#8C857E] hover:text-[#D96B43] hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isTransforming && (
        <motion.div
          id="gemini-image-generating-state"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: [0.92, 1, 0.92],
            scale: [1, 1.015, 1],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-[#FAF0E6]/80 via-white to-[#FAF0E6]/60 rounded-xl border border-[#F3D9C9] mt-1 overflow-hidden relative"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-8 h-8 rounded-full bg-[#D96B43]/20"
            />
            <div className="w-6 h-6 border-2 border-[#D96B43] border-t-transparent rounded-full animate-spin shrink-0 z-10" />
          </div>
          <div className="text-left min-w-0 flex-1 z-10">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-[#2C2A29] text-xs">Transforming with Gemini (gemini-3.1-flash-image)...</p>
              <Sparkles className="w-3 h-3 text-[#D96B43] animate-pulse shrink-0" />
            </div>
            <p className="text-[10.5px] text-[#8C857E] truncate mt-0.5">Crafting hand-drawn Japanese animation details, watercolors & atmosphere</p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CircleAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="text-xs font-bold underline hover:text-rose-700 cursor-pointer shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {transformedUrl && (
        <div className="bg-white border border-[#EBE6DD] rounded-xl p-3 space-y-2.5 mt-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D96B43] flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Original Ghibli Art Illustration
            </span>
            <span className="text-[10px] font-semibold text-[#8C857E] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#EBE6DD]">
              gemini-3.1-flash-image
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-[#EBE6DD] bg-[#FAF8F5] max-h-72 flex items-center justify-center">
            <img
              src={transformedUrl}
              alt="Generated Ghibli Art Illustration"
              className="w-full h-auto max-h-72 object-contain rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onGenerate}
              disabled={isTransforming}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FAF8F5] hover:bg-[#EBE6DD] text-[#2C2A29] rounded-xl text-xs font-bold border border-[#EBE6DD] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D96B43]" />
              <span>Generate Again</span>
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#D96B43] hover:bg-[#C85C34] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save / Download</span>
            </button>

            <button
              type="button"
              onClick={onClear}
              className="py-2 px-3 bg-[#FAF8F5] hover:bg-rose-50 hover:text-rose-600 text-[#8C857E] rounded-xl text-xs font-bold border border-[#EBE6DD] hover:border-rose-200 transition-all cursor-pointer"
              title="Start over with a new upload"
            >
              <span>Start Over</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
