// Root.tsx
import { Composition } from 'remotion';
import { Scene01Comp, Scene04Comp, Scene06Comp } from './MyComp';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Scene01"
        component={Scene01Comp}
        durationInFrames={360} // 12 seconds * 30 fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene04"
        component={Scene04Comp}
        durationInFrames={450} // 15 seconds * 30 fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene06"
        component={Scene06Comp}
        durationInFrames={300} // 10 seconds * 30 fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};