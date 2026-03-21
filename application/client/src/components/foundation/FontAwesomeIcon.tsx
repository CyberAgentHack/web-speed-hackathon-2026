import { config } from "@fortawesome/fontawesome-svg-core";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowDown,
  faArrowRight,
  faBalanceScale,
  faCircleNotch,
  faEdit,
  faEnvelope,
  faExclamationCircle,
  faHome,
  faImages,
  faMusic,
  faPaperPlane,
  faPause,
  faPlay,
  faSearch,
  faSignInAlt,
  faUser,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FAIcon } from "@fortawesome/react-fontawesome";

config.autoAddCss = false;

const solidIcons = {
  "arrow-down": faArrowDown,
  "arrow-right": faArrowRight,
  "balance-scale": faBalanceScale,
  "circle-notch": faCircleNotch,
  edit: faEdit,
  envelope: faEnvelope,
  "exclamation-circle": faExclamationCircle,
  home: faHome,
  images: faImages,
  music: faMusic,
  "paper-plane": faPaperPlane,
  pause: faPause,
  play: faPlay,
  search: faSearch,
  "sign-in-alt": faSignInAlt,
  user: faUser,
  video: faVideo,
} as const satisfies Record<string, IconDefinition>;

const regularIcons = {
  "calendar-alt": faCalendarAlt,
} as const satisfies Record<string, IconDefinition>;

type Props =
  | {
      iconType: keyof typeof solidIcons;
      styleType: "solid";
    }
  | {
      iconType: keyof typeof regularIcons;
      styleType: "regular";
    };

export const FontAwesomeIcon = ({ iconType, styleType }: Props) => {
  const icon = (() => {
    switch (styleType) {
      case "solid": {
        return solidIcons[iconType];
      }
      case "regular": {
        return regularIcons[iconType];
      }
      default: {
        return styleType satisfies never;
      }
    }
  })();
  return <FAIcon className="font-awesome inline-block leading-none" icon={icon} />;
};
