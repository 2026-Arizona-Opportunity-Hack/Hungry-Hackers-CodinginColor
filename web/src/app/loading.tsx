import { Loading } from "@/components/ui";

/** Shown by Next.js while any page is loading (route changes and server-rendered pages). */
export default function RouteLoading() {
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <Loading />
    </div>
  );
}
