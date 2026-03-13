import {Composition} from 'remotion';
import {Scene01Comp, Scene06Comp} from './MyComp';

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
                id="Scene06"
                component={Scene06Comp}
                durationInFrames={300}
                width={1920}
                height={1080}
                fps={30}
            />
        </>
    );
};
