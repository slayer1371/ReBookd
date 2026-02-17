"use client";

import { useState, useEffect } from "react";

interface ReviewModalProps {
  bookingId: string;
  businessName: string;
  serviceName: string;
  image: string | null;
  onReviewSubmitted: (review: { rating: number; comment: string }) => void;
  trigger?: React.ReactNode;
}

export default function ReviewModal({
  bookingId,
  businessName,
  serviceName,
  image,
  onReviewSubmitted,
  trigger,
}: ReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          comment,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      onReviewSubmitted({ rating, comment });
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10">
            Write Review
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-white/10 bg-[#18181b] p-6 shadow-2xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Rate your experience</h2>
              <button 
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
                {image ? (
                  <img src={image} alt={businessName} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-lg">
                    🏢
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{businessName}</p>
                  <p className="text-xs text-zinc-400">{serviceName}</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setError("")}
                    className="group focus:outline-none"
                  >
                    <svg
                      className={`h-8 w-8 transition-transform group-hover:scale-110 ${
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-zinc-800 text-zinc-700 hover:fill-zinc-700"
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.545.044.757.749.336 1.13l-4.22 3.824a.562.562 0 00-.173.575l1.295 5.922a.562.562 0 01-.828.625l-4.736-2.955a.563.563 0 00-.586 0l-4.736 2.955a.562.562 0 01-.828-.625l1.295-5.922a.562.562 0 00-.173-.575l-4.22-3.824a.562.562 0 01.336-1.13l5.518-.442a.563.563 0 00.475.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label htmlFor="comment" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Comment (optional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the service? Would you recommend it?"
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && <p className="text-center text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
