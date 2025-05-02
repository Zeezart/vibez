
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App.tsx'
import { theme } from './theme'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <App />
);
