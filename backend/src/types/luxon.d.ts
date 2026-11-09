// @types/luxon não usa o padrão clássico `declare module "luxon" { ... }`,
// então depende da resolução implícita pacote-real -> @types/* do TS, que
// falha sob moduleResolution nodenext quando o "exports" do luxon não tem
// condição "types" (reproduz só no Linux do Render, nunca localmente).
// Declarando o módulo aqui a gente deixa de depender dessa resolução
// implícita de vez.
declare module "luxon" {
  export * from "@types/luxon";
}
