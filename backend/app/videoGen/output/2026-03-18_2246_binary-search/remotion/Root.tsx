import {Composition} from 'remotion';
import {Scene03Comp} from './MyComp';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="Scene03"
                component={Scene03Comp}
                durationInFrames={300}
                width={1920}
                height={1080}
                fps={30}
            />
        </>
    );
};
