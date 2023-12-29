import Image from "next/image";
import Link from "next/link";

import adImg from "@/assets/imgs/ad.png"


export default function Ad() {



  return (
      <div className="relative mb-5 block h-80 overflow-hidden rounded-lg">
        <Image
          src={adImg}
          alt="ad"
          fill/>
      </div>
  );
}
