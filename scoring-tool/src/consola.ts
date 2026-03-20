// eslint-disable-next-line
import { createConsola } from "consola";
import debug from "debug";

export const consola = createConsola({
  level: debug.enabled("wsh:log") ? +999 : -999,
});
