
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "LinguaConnect",
    description: "Connect with language learners around the world",
    refresh: {
      httpEquiv: "refresh",
      content: "0;url=/community",
    },
  };
}
