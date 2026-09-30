import { Route, Routes } from "react-router-dom";

import { ToastProvider } from "./Toast.jsx";
import RequireAuth from "./RequireAuth.jsx";
import AdminLayout from "./AdminLayout.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import Enquiries from "./Enquiries.jsx";
import ProductsList from "./ProductsList.jsx";
import ProductEditor from "./ProductEditor.jsx";
import TeamList from "./TeamList.jsx";
import TeamEditor from "./TeamEditor.jsx";
import Catalog from "./Catalog.jsx";
import System from "./System.jsx";
import Settings from "./Settings.jsx";
import AdminNotFound from "./AdminNotFound.jsx";

/**
 * The admin dashboard, mounted at /admin/* and loaded lazily so none of it
 * ships in the public site's bundle.
 *
 * `RequireAuth` gates every route but the login screen. It is a convenience,
 * not the security boundary — the real check is `requireAuth` on the Express
 * side, which every /api/admin request goes through.
 */
export default function AdminRoutes() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductEditor mode="create" />} />
          <Route path="products/:id/edit" element={<ProductEditor mode="edit" />} />
          <Route path="team" element={<TeamList />} />
          <Route path="team/new" element={<TeamEditor mode="create" />} />
          <Route path="team/:id/edit" element={<TeamEditor mode="edit" />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="system" element={<System />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
