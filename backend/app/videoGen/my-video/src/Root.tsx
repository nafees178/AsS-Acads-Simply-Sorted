import {Composition} from 'remotion';
import {Scene02Comp, Scene04Comp, Scene06Comp} from './MyComp';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="Scene02"
                component={Scene02Comp}
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
        </>
    );
};
