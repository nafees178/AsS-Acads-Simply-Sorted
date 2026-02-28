// Root.tsx
import { Composition } from 'remotion';
import { Scene01Comp, Scene03Comp, Scene05Comp } from './MyComp';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Scene01"
        component={Scene01Comp}
        durationInFrames={360} // 12s * 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene03"
        component={Scene03Comp}
        durationInFrames={450} // 15s * 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene05"
        component={Scene05Comp}
        durationInFrames={450} // 15s * 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};