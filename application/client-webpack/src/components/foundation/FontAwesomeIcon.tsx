interface Props {
  iconType: string;
  styleType: "solid" | "regular";
}

export const FontAwesomeIcon = ({ iconType, styleType }: Props) => {
  return (
    <svg className="font-awesome inline-block fill-current leading-none">
      <use xlinkHref={`/sprites/font-awesome/${styleType}.svg#${iconType}`} />
    </svg>
  );
};
