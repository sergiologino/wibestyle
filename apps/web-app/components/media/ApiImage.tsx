"use client";



import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";



type ApiImageProps = {

  src: string;

  alt: string;

  className?: string;

};



export default function ApiImage({ src, alt, className }: ApiImageProps) {

  const blobUrl = useAuthenticatedBlob(

    src.startsWith("/assets/") || src.startsWith("http://") || src.startsWith("https://") ? null : src,

  );



  if (src.startsWith("/assets/") || src.startsWith("http://") || src.startsWith("https://")) {

    // eslint-disable-next-line @next/next/no-img-element

    return <img alt={alt} className={className} src={src} />;

  }



  if (!blobUrl) {

    return <div className={`bg-[#faf5f9] ${className ?? ""}`} />;

  }



  // eslint-disable-next-line @next/next/no-img-element

  return <img alt={alt} className={className} src={blobUrl} />;

}


