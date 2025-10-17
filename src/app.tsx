import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import AppLayout from "./layouts/app.layout";



export default function App() {
  return (
    <Router root={AppLayout}>
      <FileRoutes />
    </Router>
  );
}
