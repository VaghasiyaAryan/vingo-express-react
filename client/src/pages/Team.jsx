import { useCallback } from "react";
import Navbar from "@/components/sections/Navbar.jsx";
import TeamSection from "@/components/sections/Team.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Team() {
  useDocumentTitle("Our Team");

  const fetchTeam = useCallback((signal) => endpoints.team({ signal }), []);
  const { data, error, loading } = useApi(fetchTeam);
  const team = data?.team ?? [];

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "Team" }]} />
        <TeamSection team={team} loading={loading} error={error} />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
