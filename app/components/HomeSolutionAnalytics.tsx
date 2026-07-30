"use client";

import { sendGAEvent } from "@next/third-parties/google";

export function sendHomeSolutionClick(service: string) {
  sendGAEvent("event", "home_solution_click", {
    service,
  });
}

export function sendHomeSolutionModalOpen() {
  sendGAEvent("event", "home_solution_modal_open");
}

export function sendWhatsappClick(origin: string) {
  sendGAEvent("event", "whatsapp_click", {
    origin,
  });
}