import { X } from 'lucide-react';

/**
 * A reusable Liquid Glass modal window — frosted, refractive, with a glossy
 * specular highlight and a soft drop shadow. Backdrop click or the close
 * button dismiss it.
 */
export default function GlassModal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="glass-modal-backdrop" onClick={onClose}>
      <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">{title}</h2>}
          <button onClick={onClose} className="ml-auto rounded-full p-1.5 text-gray-400 hover:bg-white/50 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  );
}
