import { motion } from "framer-motion";

export default function FloatingStatCard({
  eyebrow,
  title,
  value,
  detail,
  delay = 0,
  className = "",
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[26px] border border-white/25 bg-slate-950/88 p-4 text-white shadow-[0_22px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl [text-shadow:_0_1px_12px_rgba(0,0,0,0.65)] ${className}`}
    >
      {(eyebrow || title) && (
        <div className="mb-3">
          {eyebrow ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-100">
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <div className="mt-1 text-sm font-semibold text-white">
              {title}
            </div>
          ) : null}
        </div>
      )}

      {value ? (
        <div className="text-[1.7rem] font-semibold tracking-[-0.03em] text-white">
          {value}
        </div>
      ) : null}

      {detail ? (
        <div className="mt-1 text-xs leading-5 text-slate-100">{detail}</div>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}
    </motion.div>
  );
}
