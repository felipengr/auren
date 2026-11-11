import { useEffect, useState } from "react";

type ResourceState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

/**
 * Busca um recurso da API com estado de carregando/erro/pronto e um
 * `reload` pra tentar de novo — sem isso, uma falha de rede deixa a tela
 * presa em "Carregando…" pra sempre (o fetch rejeita e nada trata o catch).
 */
export function useApiResource<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: "error", error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return { ...state, reload: () => setReloadKey((key) => key + 1) };
}
