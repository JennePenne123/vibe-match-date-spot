import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { PromoVideo } from "./promo/PromoVideo";

export const RemotionRoot = () => (
  <>
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={575}
    fps={30}
    width={1080}
    height={1920}
  />
    <Composition
      id="promo"
      component={PromoVideo}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
