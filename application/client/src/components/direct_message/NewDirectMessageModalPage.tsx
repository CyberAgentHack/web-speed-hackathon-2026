import { useActionState } from "react";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface FormState {
  error: string | null;
  fieldErrors: { username?: string };
}

const initialState: FormState = { error: null, fieldErrors: {} };

interface Props {
  id: string;
  onNavigate: (conversationId: string) => void;
}

export const NewDirectMessageModalPage = ({ id, onNavigate }: Props) => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const username = (formData.get("username") as string)?.trim().replace(/^@/, "") ?? "";

      if (username.length === 0) {
        return { error: null, fieldErrors: { username: "ユーザー名を入力してください" } };
      }

      try {
        const userRes = await apiClient.users[":username"].$get({
          param: { username },
        });
        if (!userRes.ok) {
          throw new Error("user not found");
        }
        const user = await userRes.json();
        const dmRes = await apiClient.dm.$post({ json: { peerId: user.id } });
        if (!dmRes.ok) {
          throw new Error("dm create failed");
        }
        const conversation = await dmRes.json();
        onNavigate(conversation.id);
        return initialState;
      } catch {
        return { error: "ユーザーが見つかりませんでした", fieldErrors: {} };
      }
    },
    initialState,
  );

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" action={formAction}>
        <FormInputField
          name="username"
          label="ユーザー名"
          placeholder="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          error={state.fieldErrors.username}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={isPending} loading={isPending}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{state.error}</ModalErrorMessage>
      </form>
    </div>
  );
};
