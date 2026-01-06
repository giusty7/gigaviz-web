export type TokenActionKey =
  | "helper_chat"
  | "graph_generate_image"
  | "tracks_generate"
  | "office_export"
  | "meta_send_message"
  | "mass_blast_send";

export type TokenRate = {
  action: TokenActionKey;
  tokens: number;
  description: string;
};

export const tokenRates: Record<TokenActionKey, TokenRate> = {
  helper_chat: {
    action: "helper_chat",
    tokens: 15,
    description: "Helper chat (per response bundle)",
  },
  graph_generate_image: {
    action: "graph_generate_image",
    tokens: 40,
    description: "Graph image generation",
  },
  tracks_generate: {
    action: "tracks_generate",
    tokens: 30,
    description: "Tracks workflow run",
  },
  office_export: {
    action: "office_export",
    tokens: 20,
    description: "Office export job",
  },
  meta_send_message: {
    action: "meta_send_message",
    tokens: 8,
    description: "Meta Hub message send",
  },
  mass_blast_send: {
    action: "mass_blast_send",
    tokens: 60,
    description: "Mass blast batch send",
  },
};

export const tokenRateList = Object.values(tokenRates);

export const tokenSafetyCopy =
  "Tokens are pay-as-you-go and separate from subscriptions. Usage can run out - monitor your balance to avoid overspend.";
