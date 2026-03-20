import { MouseEventHandler, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  post: Models.Post;
}

// 日付処理はこれが世界最速です（ライブラリ不要）
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "short",
  day: "numeric",
});

export const TimelineItem = ({ post }: Props) => {
  const navigate = useNavigate();

  // クリック判定もシンプルに（余計なループを回さない）
  const handleClick = useCallback<MouseEventHandler>((ev) => {
    const target = ev.target as HTMLElement;
    if (!target.closest('a') && !target.closest('button')) {
      navigate(`/posts/${post.id}`);
    }
  }, [post.id, navigate]);

  const displayDate = useMemo(() => dateFormatter.format(new Date(post.createdAt)), [post.createdAt]);

  return (
    <article 
      className="hover:bg-cax-surface-subtle px-1 sm:px-4 cursor-pointer" 
      onClick={handleClick}
      // content-visibilityは維持。これが最高の武器です。
      // TimelineItem.tsx 内の article の style
      style={{ 
          contentVisibility: 'auto', 
          containIntrinsicSize: '0 350px' // ★ 画像ありを見越して高めに確保（CLS対策）
      }}
    >
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link className="block h-12 w-12 overflow-hidden rounded-full border" to={`/users/${post.user.username}`}>
            <img
              alt={post.user.profileImage?.alt ?? ""}
              src={post.user.profileImage ? getProfileImagePath(post.user.profileImage.id) : ""}
              loading="lazy"
              width={64}
              height={64}
              decoding="async" // ★ ブラウザのデコードを非同期にしてカクつき防止
              className="object-cover bg-gray-100"
            />
          </Link>
        </div>
        <div className="min-w-0 shrink grow">
          <div className="text-sm">
            <span className="font-bold">{post.user.name}</span>
            <span className="text-cax-text-muted ml-1">@{post.user.username} · {displayDate}</span>
          </div>
          <div className="text-cax-text leading-relaxed mt-1">
             <p className="whitespace-pre-wrap break-words">{post.text}</p>
          </div>
          
          {/* 
             ★ 画像はそのまま出す！
             ただし ImageArea 内の img タグにも width/height があることが前提です。
          */}
          {post.images?.length > 0 && (
            <div className="mt-2">
              <ImageArea images={post.images} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};