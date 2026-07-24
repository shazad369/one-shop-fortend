import { Helmet } from "react-helmet-async";

interface SeoProps {
  path: string;
}

export default function Seo({ path }: SeoProps) {
  const canonicalUrl = `https://oneshop.pre.bd${path === "/" ? "/" : path}`;
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
