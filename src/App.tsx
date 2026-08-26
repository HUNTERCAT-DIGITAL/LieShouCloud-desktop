/**
 * 桌面端 App 入口.
 */
import { BrowserRouter } from "react-router-dom";
import { routes } from "./routes";

export default function App() {
  return <BrowserRouter>{routes}</BrowserRouter>;
}
