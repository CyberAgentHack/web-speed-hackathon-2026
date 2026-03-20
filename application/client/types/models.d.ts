declare namespace Models {
  interface ProfileImage {
    alt: string;
    id: string;
  }

  interface User {
    createdAt: string;
    description: string;
    id: string;
    name: string;
    password: string;
    profileImage: ProfileImage;
    username: string;
  }

  interface Image {
    alt: string;
    id: string;
  }

  interface Sound {
    artist: string;
    id: string;
    title: string;
  }

  interface Movie {
    id: string;
  }

  interface Post {
    createdAt: string;
    id: string;
    images: Image[];
    movie: Movie | null;
    sound: Sound | null;
    text: string;
    user: User;
  }

  interface Comment {
    createdAt: string;
    id: string;
    post: Post;
    text: string;
    user: User;
  }

  interface DirectMessage {
    id: string;
    sender: User;
    body: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface DirectMessageConversation {
    id: string;
    initiator: User;
    member: User;
    messages: DirectMessage[];
    hasUnread?: boolean;
  }

  interface ChatMessage {
    role: "user" | "assistant";
    content: string;
  }

  interface SSEChunk {
    text?: string;
    done?: boolean;
  }
}
