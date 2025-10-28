import { useSessionController } from './session/SessionProvider';
import { GameHub } from './GameHub';
import { RhythmTapScreen } from '@modules/rhythm-tap/RhythmTapScreen';
import { PairMatchScreen } from '@modules/pair-match/PairMatchScreen';
import { ConcentrationScreen } from '@modules/concentration/ConcentrationScreen';
import { SequenceSparkScreen } from '@modules/sequence-spark/SequenceSparkScreen';
import { ShapeBuilderScreen } from '@modules/shape-builder/ShapeBuilderScreen';
import { CardSprintScreen } from '@modules/card-sprint/CardSprintScreen';
import { SummaryScreen } from './SummaryScreen';
import { CelebrationOverlay } from '@ui/components/CelebrationOverlay';

export const AppRouter = () => {
  const { stage, activeGame } = useSessionController();

  let screen: JSX.Element = <GameHub />;

  if (stage === 'game') {
    if (activeGame === 'rhythm') {
      screen = <RhythmTapScreen />;
    }
    if (activeGame === 'pair-match') {
      screen = <PairMatchScreen />;
    }
    if (activeGame === 'concentration') {
      screen = <ConcentrationScreen />;
    }
    if (activeGame === 'sequence-spark') {
      screen = <SequenceSparkScreen />;
    }
    if (activeGame === 'shape-builder') {
      screen = <ShapeBuilderScreen />;
    }
    if (activeGame === 'card-sprint') {
      screen = <CardSprintScreen />;
    }
  }

  if (stage === 'summary') {
    screen = <SummaryScreen />;
  }

  return (
    <>
      {screen}
      <CelebrationOverlay />
    </>
  );
};
