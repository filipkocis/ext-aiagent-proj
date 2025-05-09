import { createRoot } from 'react-dom/client'
import styles from '../index.css?inline'
import Content from './Content'

const shadowRoot = document.createElement('div')
shadowRoot.id = 'shadow-root'
const root = document.createElement('div')
root.id = 'sales-assistant-extension-root'

const rootShadow = root.attachShadow({ mode: 'open' })

document.body.appendChild(root)
rootShadow.appendChild(shadowRoot)

const css = new CSSStyleSheet()
css.replaceSync(styles)
rootShadow.adoptedStyleSheets = [css]

createRoot(shadowRoot).render(<Content />)
