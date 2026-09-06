import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { pathToRoot } from "../../util/path";
import homeHeroConfig from "./HomeHeroConfig";

interface HomeHeroConfig {
  title: string;
  subtitle: string;
  utilityLabels: string[];
  lowerLabels: string[];
  descriptionLines: string[];
  videoUrl: string;
}

const OqcHomeHero: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const config = homeHeroConfig as HomeHeroConfig;
  if (fileData.slug !== "index") return null;

  const baseDir = pathToRoot(fileData.slug);
  return (
    <section class="oqc-home-hero" aria-labelledby="oqc-home-hero-title">
      <video
        class="oqc-home-hero__video"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-hidden="true"
      >
        <source src={`${baseDir}/${config.videoUrl}`} type="video/mp4" />
      </video>
      <div class="oqc-home-hero__wash" aria-hidden="true"></div>
      <nav
        class="oqc-home-hero__utility"
        aria-label={config.utilityLabels.join(", ")}
      >
        {config.utilityLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </nav>
      <div class="oqc-home-hero__title-block">
        <h2 id="oqc-home-hero-title" class="oqc-home-hero__title-en">
          {config.title}
        </h2>
        <p class="oqc-home-hero__title-zh">{config.subtitle}</p>
      </div>
      <div class="oqc-home-hero__lower">
        {config.lowerLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
        <p>
          {config.descriptionLines.map((line, index) => (
            <span key={line}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};

OqcHomeHero.css = `
.oqc-home-hero {
  position: relative;
  isolation: isolate;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 0;
  margin: 0 0 2rem;
  overflow: hidden;
  border-radius: clamp(14px, 1.7vw, 24px);
  background: #50413e;
  color: #fffaf6;
}

.oqc-home-hero__video,
.oqc-home-hero__wash {
  position: absolute;
  inset: 0;
}

.oqc-home-hero__video {
  z-index: -2;
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  background: #50413e;
}

.oqc-home-hero__wash {
  z-index: -1;
  background: rgba(89, 61, 55, 0.2);
  pointer-events: none;
}

.oqc-home-hero__utility,
.oqc-home-hero__lower,
.oqc-home-hero__title-block {
  position: absolute;
  z-index: 1;
}

.oqc-home-hero__utility,
.oqc-home-hero__lower {
  right: clamp(24px, 6vw, 72px);
  left: clamp(24px, 6vw, 72px);
  display: grid;
  align-items: center;
  font-family: "等线", DengXian, "Helvetica Neue", sans-serif;
  font-size: clamp(0.65rem, 1vw, 0.95rem);
  letter-spacing: 0.1em;
  line-height: 1.4;
}

.oqc-home-hero__utility {
  top: clamp(22px, 3vw, 40px);
  grid-template-columns: repeat(4, 1fr);
}

.oqc-home-hero__utility span:nth-child(2),
.oqc-home-hero__utility span:nth-child(3) {
  justify-self: center;
}

.oqc-home-hero__utility span:last-child {
  justify-self: end;
}

.oqc-home-hero__title-block {
  top: 57%;
  left: clamp(24px, 6vw, 72px);
  transform: translateY(-50%);
}

.oqc-home-hero__title-en,
.oqc-home-hero__title-zh {
  margin: 0;
  color: #fffaf6;
  font-weight: 400;
  text-shadow: 0 2px 18px rgba(20, 10, 10, 0.16);
}

.oqc-home-hero__title-en {
  font-family: "CastleT", "Times New Roman", serif;
  font-size: clamp(3.2rem, 6vw, 92pt);
  letter-spacing: -0.045em;
  line-height: 0.95;
  white-space: nowrap;
}

.oqc-home-hero__title-zh {
  margin-top: clamp(14px, 1.8vw, 24px);
  font-family: "幼圆", YouYuan, "Microsoft YaHei", sans-serif;
  font-size: clamp(2.8rem, 4.7vw, 72pt);
  letter-spacing: 0.08em;
  line-height: 1;
}

.oqc-home-hero__lower {
  bottom: clamp(24px, 3.5vw, 52px);
  grid-template-columns: 1fr 1fr 1.55fr;
  gap: clamp(20px, 4vw, 60px);
  align-items: end;
}

.oqc-home-hero__lower p {
  max-width: 28ch;
  margin: 0;
  justify-self: end;
  color: #fffaf6;
  letter-spacing: 0.08em;
}

@media (min-width: 601px) {
  @container (max-width: 760px) {
    html[data-oqc-skin="standard-design"] .oqc-home-hero__title-block {
      top: 47%;
    }

    html[data-oqc-skin="standard-design"] .oqc-home-hero__title-en {
      font-size: clamp(2.75rem, 6.8cqi, 3.2rem);
    }
  }
}

@media (max-width: 600px) {
  .oqc-home-hero {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 9;
    min-height: 0;
    margin-left: 0;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }

  .oqc-home-hero__video {
    object-position: 58% center;
  }

  .oqc-home-hero__utility,
  .oqc-home-hero__lower {
    right: 18px;
    left: 18px;
    font-size: 0.52rem;
    letter-spacing: 0.05em;
  }

  .oqc-home-hero__utility {
    top: 20px;
  }

  .oqc-home-hero__title-block {
    top: 54%;
    left: 20px;
    right: 20px;
  }

  .oqc-home-hero__title-en {
    font-size: clamp(1.45rem, 7vw, 2.3rem);
    white-space: nowrap;
  }

  .oqc-home-hero__title-zh {
    margin-top: 6px;
    font-size: clamp(1.6rem, 8vw, 2.8rem);
  }

  .oqc-home-hero__lower {
    bottom: 20px;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .oqc-home-hero__lower p {
    display: none;
  }
}

/* When the Explorer collapses, let the Hero use the full reading column. */
@media (min-width: 601px) and (max-width: 1024px) {
  .oqc-home-hero {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    border-radius: clamp(12px, 1.7vw, 20px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .oqc-home-hero__video {
    display: none;
  }
}
`;

export default (() => OqcHomeHero) satisfies QuartzComponentConstructor;
