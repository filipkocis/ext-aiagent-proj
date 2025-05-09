import { runScan } from './gemini'
import { registerListener } from './listener'
import { useCallback, useEffect, useRef, useState } from "react";
import type { Item, Status } from "../App";
import './Content.css'

export type Data = {
  status: Status,
  is_sales_page: boolean,
  items: Item[]
}

export default function Content() {
  const prevData = useRef<Data>(null)
  const refData = useRef<Data>(null)
  const [pos, setPos] = useState<{index: number | null, x: number, y: number}>({ index: null, x: 0, y: 0 })
  const [data, setData] = useState<Data>({
    status: "Not loaded",
    is_sales_page: false,
    items: [],
  })
  refData.current = data

  const getData = () => {
    return refData.current!
  }

  const setDataHandler = (data: Data) => {
    setData(data)
    refData.current = data
  }

  const hoverHandler = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const itemEl = target.closest<HTMLElement>("[inj-item-id]")
    const itemId = itemEl?.getAttribute("inj-item-id")
    if (!itemId) return;
    const index = parseInt(itemId)!;
    setPos({
      index,
      x: window.scrollX + event.clientX,
      y: window.scrollY + event.clientY,
    })
  }, [])

  const hoverLeaveHandler = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const itemEl = target.closest<HTMLElement>("[inj-item-id]")
    const itemId = itemEl?.getAttribute("inj-item-id")
    if (!itemId) return;
    const index = parseInt(itemId)!;

    setPos(prev => {
      if (prev.index !== index) return prev;
      return {
        index: null,
        x: 0,
        y: 0,
      }
    })
  }, [])

  useEffect(() => {
    registerListener(getData, setDataHandler)
    runScan(setDataHandler)
  }, [])

  useEffect(() => {
    setPos({ index: null, x: 0, y: 0 })

    if (prevData.current) {
      for (const item of prevData.current.items) {
        if (!item.selector) continue;
        const elements = document.querySelectorAll(item.selector);
        if (elements.length === 0) continue;
        const element = elements[0] as HTMLElement;
        element.classList.remove("inj-ext-highlight-container")
        element.removeAttribute("inj-item-id")
        element.removeEventListener("mousemove", hoverHandler)
        element.removeEventListener("mouseleave", hoverLeaveHandler)
      }
    }

    let i = -1;
    for (const item of data.items) {
      i++;
      if (!item.selector) continue;
      const elements = document.querySelectorAll(item.selector);
      if (elements.length === 0) continue;
      item.valid = true;
      const element = elements[0] as HTMLElement;

      if (data.is_sales_page) {
        element.classList.add("inj-ext-highlight-container")
        element.setAttribute("inj-item-id", i + '')
        element.addEventListener("mousemove", hoverHandler)
        element.addEventListener("mouseleave", hoverLeaveHandler)
      }
    } 

    prevData.current = data
  }, [data])

  return (
    <div style={{
      zIndex: 9999,
      top: pos.y,
      left: pos.x + 40,
      display: pos.index !== null ? "block" : "none",
    }} className="translate-x-0 -translate-y-1/2 max-w-[300px] absolute flex flex-col bg-gray-900 rounded-lg border text-white border-gray-700 px-4 py-2">
      {pos.index !== null && data.items.length > pos.index && (<>
        <p>{data.items[pos.index].product_name || "Unknown Name"}</p>
        <p className="text-sm text-white/80">{data.items[pos.index].product_info || "No description available"}</p>
      </>)}
    </div>
  )
}
