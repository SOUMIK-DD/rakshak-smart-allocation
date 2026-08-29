import React, { useEffect, useState } from "react";
import { undo, redo } from "../api";

interface Props {
  onAction: () => void;
}

export default function UndoRedo({ onAction }: Props) {
  const [loading, setLoading] = useState(false);

  const handleUndo = async () => {
    setLoading(true);
    try {
      await undo();
      onAction();
    } catch (err) {
      console.error("Undo failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedo = async () => {
    setLoading(true);
    try {
      await redo();
      onAction();
    } catch (err) {
      console.error("Redo failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button
        onClick={handleUndo}
        disabled={loading}
        title="Undo (Ctrl+Z)"
        style={{
          padding: "6px 10px",
          borderRadius: 4,
          border: "1px solid #475569",
          background: "#334155",
          color: "#e2e8f0",
          fontSize: 12,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        ↩️
      </button>
      <button
        onClick={handleRedo}
        disabled={loading}
        title="Redo (Ctrl+Y)"
        style={{
          padding: "6px 10px",
          borderRadius: 4,
          border: "1px solid #475569",
          background: "#334155",
          color: "#e2e8f0",
          fontSize: 12,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        ↪️
      </button>
    </div>
  );
}
