import LandingPage from "@/components/landing/LandingPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <LandingPage slug={slug} />;
}
