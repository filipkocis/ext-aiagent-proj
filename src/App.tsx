import { useEffect, useState } from 'react'
import './App.css'

export type Item = {
  selector?: string
  product_name?: string
  product_info?: string
  valid: boolean
}

export type Status = "Not loaded" | "Loading..." | "Finished" | "Error"

function requestContentSelect(index: number) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: "SELECT", payload: { index } });
  })
}

function App() {
  const [status, setStatus] = useState<Status>("Not loaded")
  const [items, setItems] = useState<Item[] | null>([])

  const scanSite = (rescan: boolean) => {
    console.log("Requesting scan...")
    setItems([])
    setStatus("Loading...")

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "SCAN", payload: { rescan } }, (response) => {
        if (response?.type === "SCAN") {
          console.log("Received scan response")
          setStatus(response.status)
          if (response.is_sales_page) {
            setItems(response.items)
          } else {
            setItems(null)
          }
        } else {
          setStatus("Error")
        }
      });
    })
  }

  useEffect(() => {
    console.log("App mounted")
    scanSite(false)
  }, [])

  return (
    <main className="flex flex-col gap-6 p-4 w-md h-[600px]">
      <img src="/icon32.png" className="logo self-center" alt="gemini logo" />

      <div className="flex flex-col gap-2 w-full">
        <p className="text-center text-xl font-bold">Sales Assistant</p>
        <div className="flex gap-2 items-center justify-between px-4">
          <p>Status: {status.toUpperCase()}</p>
          <button
            disabled={status === "Loading..."}
            className="hover:bg-blue-400 bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            onClick={() => scanSite(true)}
          >{status === "Loading..." ? "Scanning..." : "Scan"}</button>
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto">
        {items === null && <p className="text-center text-sm text-gray-500">No sales page detected</p>}

        {items && !items.length && <p className="text-center text-sm text-gray-500">No items</p>}

        {items && items.map((item, i) => (
          <div 
            key={i}
            data-valid={item.valid}
            className="flex flex-col border-t border-white/60 p-4 hover:bg-gray-900 transition-colors cursor-pointer data-[valid=false]:opacity-50 data-[valid=false]:pointer-events-none"
            onClick={() => item.valid && requestContentSelect(i)}
          >
            <p className="items-center flex gap-2 font-[1rem] text-white">
              {item.product_name || "Unknown Name"}
              {!item.valid && <span className="text-[0.7rem] text-white bg-red-500 rounded-full px-1.5 py-0.5">Invalid</span>}
            </p>
            <p className="font-[0.8rem] text-white/80">{item.product_info || "No description available"}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

export default App
