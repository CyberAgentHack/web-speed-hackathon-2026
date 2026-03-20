interface Props {
  className?: string;
}

export const CrokLogo = ({ className }: Props) => (
  <svg className={className}>
    <use xlinkHref="/images/icons/crok.svg#crok" />
  </svg>
);
