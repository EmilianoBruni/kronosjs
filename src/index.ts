// src/index.ts

import type { KBaseParams, KCronConfig, KJob } from './types.js';

import Kronos from './libs/Kronos.js';

export default Kronos;

export type { KBaseParams as CJBaseParams, KCronConfig, KJob };
