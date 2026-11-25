import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {MusicVideo} from './MusicVideo';
import {FPS, H, TL, W} from './lib';
import mtl from '../music-timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EffortVideo"
      component={EffortVideo}
      durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="MusicVideo"
      component={MusicVideo}
      durationInFrames={Math.round(mtl.duration * mtl.fps)}
      fps={mtl.fps}
      width={W}
      height={H}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
