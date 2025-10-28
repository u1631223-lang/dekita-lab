import { registerGameModule } from '@core/engine';
import { createRhythmTapModule } from './rhythm-tap/module';
import { createPairMatchModule } from './pair-match/module';
import { createSequenceSparkModule } from './sequence-spark/module';
import { createShapeBuilderModule } from './shape-builder/module';
import { createCardSprintModule } from './card-sprint/module';

let registered = false;

export const ensureGameModulesRegistered = () => {
  if (registered) {
    return;
  }
  registerGameModule(createRhythmTapModule());
  registerGameModule(createPairMatchModule());
  registerGameModule(createSequenceSparkModule());
  registerGameModule(createShapeBuilderModule());
  registerGameModule(createCardSprintModule());
  registered = true;
};
