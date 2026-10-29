import type { ComponentType } from 'react';
import BrickBreakerGuide from './how-to-get-better-at-brick-breaker';
import EndlessRunnerGuide from './endless-runner-beginner-tips';
import SpaceSurvivalGuide from './space-survival-strategies';

export const GUIDE_BODIES: Record<string, ComponentType> = {
  'endless-runner-beginner-tips': EndlessRunnerGuide,
  'how-to-get-better-at-brick-breaker': BrickBreakerGuide,
  'space-survival-strategies': SpaceSurvivalGuide,
};
