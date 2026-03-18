import {Composition} from 'remotion';
import {Scene01Comp, Scene05Comp} from './MyComp';
import {Scene02Comp} from './Fallback02';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="Scene01"
                component={Scene01Comp}
                durationInFrames={300}
                width={1920}
                height={1080}
                fps={30}
            />
            <Composition
                id="Scene05"
                component={Scene05Comp}
                durationInFrames={300}
                width={1920}
                height={1080}
                fps={30}
            />
            <Composition
                id="Scene02"
                component={Scene02Comp}
                durationInFrames={300}
                width={1920}
                height={1080}
                fps={30}
            />
        </>
    );
};
