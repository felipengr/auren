// luxon tem um "exports" map sem condição "types", e @types/luxon não usa
// o padrão clássico `declare module "luxon" { ... }` — então, sob
// moduleResolution nodenext, a ligação pacote-real -> tipos quebra de um
// jeito que só reproduz no Linux do Render (nunca local, em nenhuma das
// duas tentativas anteriores de reexportar os tipos reais do pacote).
// Só DateTime é usado no projeto (como valor e como tipo em anotações) —
// declara um placeholder com identidade de tipo real e membros `any`, sem
// depender de nenhuma resolução implícita de tipos.
declare module "luxon" {
  export class DateTime {
    static [member: string]: any;
    [member: string]: any;
  }
}
