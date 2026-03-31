import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import { UserProfileHeader } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfileHeader";

interface Props {
  timeline: Models.Post[];
  user: Models.User;
}

export const UserProfilePage = ({ timeline, user }: Props) => {
  return (
    <>
      <UserProfileHeader user={user} />
      <div className="border-cax-border border-t">
        <Timeline timeline={timeline} />
      </div>
    </>
  );
};
