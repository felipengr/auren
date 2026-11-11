import { Alert } from "./Alert";
import { Button } from "./Button";

export function ErrorState({
  message = "Não foi possível carregar os dados. Verifique sua conexão.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert variant="error" title={message} />
      <Button variant="secondary" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
