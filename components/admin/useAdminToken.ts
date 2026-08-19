"use client";
import { createContext, useContext } from "react";

export const AdminTokenContext = createContext<string>("");

export function useAdminToken() {
  const token = useContext(AdminTokenContext);
  return token;
}
