import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";
import { usePreloadImage } from "@web-speed-hackathon-2026/client/src/hooks/use_preload_image";
import {
    getImagePath,
    getProfileImagePath,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
    timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
    const firstPost = timeline[0];
    const lcpCandidateImageSrc =
        firstPost?.images?.[0] != null
            ? getImagePath(firstPost.images[0].id)
            : firstPost?.user?.profileImage != null
              ? getProfileImagePath(firstPost.user.profileImage.id)
              : null;

    usePreloadImage(lcpCandidateImageSrc);

    return (
        <section>
            {timeline.map((post, idx) => {
                return (
                    <TimelineItem
                        key={post.id}
                        post={post}
                        prioritizeLcpImage={idx === 0}
                    />
                );
            })}
        </section>
    );
};
