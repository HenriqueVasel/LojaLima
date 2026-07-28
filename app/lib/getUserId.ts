import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Visitante
  if (!token) {
    return null;
  }

  try {
    const decoded: any = verifyToken(token);

    if (!decoded?.userId) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}