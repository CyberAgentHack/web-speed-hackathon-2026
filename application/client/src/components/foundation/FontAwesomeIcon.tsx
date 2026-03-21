import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon as ReactFontAwesomeIcon } from "@fortawesome/react-fontawesome";

type StyleType = "solid" | "regular";
type SolidIconType =
  | "home"
  | "search"
  | "envelope"
  | "edit"
  | "user"
  | "sign-in-alt"
  | "balance-scale"
  | "arrow-right"
  | "paper-plane"
  | "circle-notch"
  | "images"
  | "music"
  | "video"
  | "exclamation-circle"
  | "arrow-down"
  | "play"
  | "pause";
type RegularIconType = "calendar-alt";
type IconType = SolidIconType | RegularIconType;

interface Props {
  iconType: IconType;
  styleType: StyleType;
}

const solidIcons: Record<SolidIconType, IconDefinition> = {
  home: faHome,
  search: faSearch,
  envelope: faEnvelope,
  edit: faEdit,
  user: faUser,
  "sign-in-alt": faSignInAlt,
  "balance-scale": faBalanceScale,
  "arrow-right": faArrowRight,
  "paper-plane": faPaperPlane,
  "circle-notch": faCircleNotch,
  images: faImages,
  music: faMusic,
  video: faVideo,
  "exclamation-circle": faExclamationCircle,
  "arrow-down": faArrowDown,
  play: faPlay,
  pause: faPause,
};

const regularIcons: Record<RegularIconType, IconDefinition> = {
  "calendar-alt": faCalendarAlt,
};

export const FontAwesomeIcon = ({ iconType, styleType }: Props) => {
  const icon = styleType === "solid" ? solidIcons[iconType as SolidIconType] : regularIcons[iconType as RegularIconType];

  if (!icon) {
    return null;
  }

  return <ReactFontAwesomeIcon icon={icon} className="font-awesome inline-block fill-current leading-none" />;
};
