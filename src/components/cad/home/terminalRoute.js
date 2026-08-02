export const terminalRoute = (d) =>
  d.category === "Fire" ? `/cad/fire/${d.id}`
  : d.category === "EMS" ? `/cad/ems/${d.id}`
  : d.category === "Civilian" ? `/cad/civilian/${d.id}`
  : d.category === "Dispatch" ? `/cad/dispatch`
  : `/cad/mdt/${d.id}`;