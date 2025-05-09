import type { Dispatch, SetStateAction } from "react";
import type { Data } from "./Content";
import { runScan } from "./gemini";

export function registerListener(getData: () => Data, setData: Dispatch<SetStateAction<Data>>) {
  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.type === "SELECT") {
      const index = request.payload.index  
      console.log("Received select request at ", index)

      const element = document.querySelector(`[inj-item-id="${index}"]`); 
      if (!element) return;

      const rect = element.getBoundingClientRect();
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.dispatchEvent(new MouseEvent("mousemove", {
        bubbles: true,
        clientX: rect.x + rect.width / 2 - 100,
        clientY: rect.y + rect.height / 2,
      }))

      return;
    }

    if (request.type !== "SCAN") return;
    console.log("Received scan request from popup");

    async function prepareScan() {
      const data = getData();
      if (data.status === "Loading..." || !request.payload.rescan ) {
        console.log("Returning cached data...")
        sendResponse({ type: "SCAN", ...data });
      } else {
        console.log("Restarting scan...")
        await runScan(setData);
        const data = getData();
        sendResponse({ type: "SCAN", ...data });
      }
    }
    prepareScan()

    return true;
  })
}
