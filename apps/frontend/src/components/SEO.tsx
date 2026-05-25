// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Helmet as HelmetBase } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
  keywords?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Helmet = HelmetBase as any;

export const SEO = ({
  title,
  description,
  canonical = "https://seribuasa.id/",
  ogImage = "https://seribuasa.id/og-image.jpg",
  ogType = "website",
  noIndex = false,
  keywords,
}: SEOProps) => {
  const fullTitle = `${title} | SeribuAsa`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="id_ID" />
      <meta property="og:site_name" content="SeribuAsa" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
