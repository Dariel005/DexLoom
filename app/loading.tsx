import { PokedexFrame } from "@/components/PokedexFrame";
import { ScanLoader } from "@/components/ScanLoader";

export default function HomeLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <PokedexFrame
        status="loading"
        leftPanel={<ScanLoader />}
        rightPanel={<ScanLoader />}
      />
    </main>
  );
}
