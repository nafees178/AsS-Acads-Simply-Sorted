import {Composition} from 'remotion';
import {Scene01Comp, Scene04Comp, Scene06Comp, Scene05Comp} from './MyComp';

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
                id="Scene04"
                component={Scene04Comp}
                durationInFrames={300}
                width={1920}
                height={1080}
                fps={30}
            />
            <Composition
                id="Scene06"
                component={Scene06Comp}
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
        </>
    );
};
