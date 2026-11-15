import { LinkButton } from "./ui";
import { EmptyState } from "./ui";

export function LoadProblem({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl bg-cic-danger-bg p-4 text-cic-danger">
      <p className="font-bold">We couldn&apos;t load your classes.</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function NoClasses() {
  return (
    <EmptyState title="No classes yet" action={<LinkButton href="/teach/new">Create your first class</LinkButton>}>
      Make a class, add your roster and share the code. It takes under 10 minutes.
    </EmptyState>
  );
}
