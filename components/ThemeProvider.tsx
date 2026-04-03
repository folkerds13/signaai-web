"use client";
import { useEffect } from "react";

export default function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
    }
  }, []);
  return null;
}
