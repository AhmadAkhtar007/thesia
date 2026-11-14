import { LIVE } from '../config';
import { localRepo } from './local';
import { remoteRepo } from './remote';
import type { Repo } from './types';

export const repo: Repo = LIVE ? remoteRepo : localRepo;
export * from './types';
