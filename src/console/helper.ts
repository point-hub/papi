import { URL, fileURLToPath } from "url";

export const stubDir = fileURLToPath(new URL("../../stub", import.meta.url));
